import asyncio
import httpx
import random
import time
from datetime import datetime, timedelta, timezone
import logging

# Import shared modules
import config
import user_agents
from supabase_utils import delete_table, query_table, update_table

# --- Setup Logging ---
logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(levelname)s - %(message)s')

# --- Helper Functions ---

def get_utc_now() -> datetime:
    """Returns the current time in UTC."""
    return datetime.now(timezone.utc)

def get_past_date(days: int) -> datetime:
    """Returns the datetime object for a specific number of days ago in UTC."""
    return get_utc_now() - timedelta(days=days)

async def _check_single_linkedin_job_active(job_id: str, client: httpx.AsyncClient) -> bool | None:
    """
    Checks if a single LinkedIn job is still active.
    Returns:
        True if the job appears inactive (404, redirect, specific text).
        False if the job appears active.
        None if the check failed after retries.
    """
    job_detail_url = f"https://www.linkedin.com/jobs-guest/jobs/api/jobPosting/{job_id}"
    retries = 0
    inactive_keywords = ["this job is no longer available", "job is closed", "No longer accepting applications"] # Add more if needed


    while retries <= config.ACTIVE_CHECK_MAX_RETRIES:
        try:
            sleep_time = random.uniform(5.0, 15.0)
            logging.info(f"Waiting for {sleep_time:.2f} seconds before next request...")
            time.sleep(sleep_time)

            # Rotate user agent and proxy for each attempt
            user_agent = random.choice(user_agents.USER_AGENTS)
            headers = {'User-Agent': user_agent}

            logging.debug(f"Checking job {job_id} (Attempt {retries+1}/{config.ACTIVE_CHECK_MAX_RETRIES+1}) URL: {job_detail_url} with UA: {user_agent}")

            response = await client.get(
                job_detail_url,
                headers=headers,
                timeout=config.ACTIVE_CHECK_TIMEOUT,
                follow_redirects=True # Allow redirects to check final destination
            )

            # Check for 404 specifically
            if response.status_code == 404:
                logging.info(f"Job {job_id} returned 404. Marking as inactive.")
                return True

            # Check for other non-successful status codes (could indicate removal, private, etc.)
            # Allow redirects (3xx) as httpx handles them by default with follow_redirects=True
            if response.status_code >= 400:
                 logging.warning(f"Job {job_id} check failed with status {response.status_code}. Assuming active for now.")
                 # Decide if other errors mean inactive. For now, only 404 is definitive.
                 # Could return True here for stricter checking.
                 return False # Or None if we want to retry later

            # Check content for inactive keywords
            response_text_lower = response.text.lower()
            for keyword in inactive_keywords:
                if keyword in response_text_lower:
                    logging.info(f"Job {job_id} contains inactive keyword '{keyword}'. Marking as inactive.")
                    return True

            # If status is OK and no inactive keywords found
            logging.debug(f"Job {job_id} appears active (Status: {response.status_code}).")
            return False

        except httpx.TimeoutException:
            logging.warning(f"Timeout checking job {job_id} (Attempt {retries+1}).")
        except httpx.RequestError as e:
            logging.warning(f"Request error checking job {job_id} (Attempt {retries+1}): {e}")
        except Exception as e:
            logging.error(f"Unexpected error checking job {job_id} (Attempt {retries+1}): {e}")

        retries += 1
        if retries <= config.ACTIVE_CHECK_MAX_RETRIES:
            wait_time = config.ACTIVE_CHECK_RETRY_DELAY + random.uniform(0, 5)
            logging.info(f"Retrying job {job_id} check after {wait_time:.2f} seconds...")
            await asyncio.sleep(wait_time)

    logging.error(f"Failed to check job {job_id} activity after {config.ACTIVE_CHECK_MAX_RETRIES + 1} attempts.")
    return None # Failed to determine status

# --- Main Management Functions ---

async def mark_expired_jobs():
    """Marks old jobs (not applied/interviewing) as expired."""
    logging.info("--- Starting Task: Mark Expired Jobs ---")
    expiry_date = get_past_date(config.JOB_EXPIRY_DAYS)
    # Format for Supabase timestampz query
    expiry_date_str = expiry_date.isoformat()
    excluded_statuses = ['applied', 'offer', 'interviewing'] # Add any status that means "don't expire"

    try:
        # Select jobs to expire
        data = query_table(
            config.SUPABASE_TABLE_NAME,
            select="job_id",
            filters={
                "scraped_at": ("lt", expiry_date_str),
                "status": ("not_in", excluded_statuses),
                "is_active": ("eq", True),
            },
        )

        if data:
            job_ids_to_expire = [job['job_id'] for job in data if job.get('job_id')]
            logging.info(f"Found {len(job_ids_to_expire)} jobs older than {config.JOB_EXPIRY_DAYS} days to mark as expired.")

            if job_ids_to_expire:
                update_response = update_table(
                    config.SUPABASE_TABLE_NAME,
                    {"job_state": "expired", "is_active": False},
                    {"job_id": ("in", job_ids_to_expire)},
                )
                if update_response is not None:
                    logging.info(f"Successfully marked {len(job_ids_to_expire)} jobs as expired.")
                else:
                    logging.warning("Mark expired jobs update executed but no response was returned.")
        else:
            logging.info("No jobs found meeting the criteria for expiration.")

    except Exception as e:
        logging.error(f"Error marking expired jobs: {e}")

    logging.info("--- Finished Task: Mark Expired Jobs ---")


async def check_linkedin_job_activity():
    """Checks if active jobs are still available on LinkedIn."""
    logging.info("--- Starting Task: Check Job Activity ---")
    check_older_than_date = get_past_date(config.JOB_CHECK_DAYS)
    check_older_than_date_str = check_older_than_date.isoformat()
    now_str = get_utc_now().isoformat()

    jobs_to_check = []
    try:
        excluded_statuses = ['applied', 'offer', 'interviewing']
        data = query_table(
            config.SUPABASE_TABLE_NAME,
            select="job_id,last_checked",
            filters={
                "is_active": ("eq", True),
                "provider": ("eq", "linkedin"),
                "status": ("not_in", excluded_statuses),
                "last_checked": ("lt", check_older_than_date_str),
            },
            order="last_checked.asc",
            limit=config.JOB_CHECK_LIMIT,
        )

        if data:
            jobs_to_check = data
            logging.info(f"Found {len(jobs_to_check)} active jobs to check (limit: {config.JOB_CHECK_LIMIT}).")
        else:
            logging.info("No active jobs need checking currently.")
            return

    except Exception as e:
        logging.error(f"Error fetching jobs to check: {e}")
        return

    # Use httpx.AsyncClient for connection pooling and efficiency
    async with httpx.AsyncClient() as client:
        tasks = []
        for job in jobs_to_check:
            tasks.append(_check_single_linkedin_job_active(job['job_id'], client))
        results = await asyncio.gather(*tasks, return_exceptions=True)

    inactive_job_ids = []
    active_checked_job_ids = []
    failed_check_job_ids = []

    for i, result in enumerate(results):
        job_id = jobs_to_check[i]['job_id']
        if isinstance(result, Exception):
            logging.error(f"Exception checking job {job_id}: {result}")
            failed_check_job_ids.append(job_id)
        elif result is True: # Job confirmed inactive
            inactive_job_ids.append(job_id)
        elif result is False: # Job confirmed active
            active_checked_job_ids.append(job_id)
        elif result is None: # Check failed after retries
            failed_check_job_ids.append(job_id)

    logging.info(f"Activity Check Summary: Inactive={len(inactive_job_ids)}, Active={len(active_checked_job_ids)}, Failed={len(failed_check_job_ids)}")

    # Update Supabase
    try:
        if inactive_job_ids:
            inactive_result = update_table(
                config.SUPABASE_TABLE_NAME,
                {"job_state": "removed", "is_active": False, "last_checked": now_str},
                {"job_id": ("in", inactive_job_ids)},
            )
            logging.info(f"Marked {len(inactive_job_ids)} jobs as removed. Result: {inactive_result is not None}")

        if active_checked_job_ids:
            active_result = update_table(
                config.SUPABASE_TABLE_NAME,
                {"last_checked": now_str},
                {"job_id": ("in", active_checked_job_ids)},
            )
            logging.info(f"Updated last_checked for {len(active_checked_job_ids)} active jobs. Result: {active_result is not None}")

    except Exception as e:
        logging.error(f"Error updating job statuses after activity check: {e}")

    logging.info("--- Finished Task: Check Job Activity ---")


async def delete_old_inactive_jobs():
    """Permanently deletes very old inactive jobs."""
    logging.info("--- Starting Task: Delete Old Inactive Jobs ---")
    delete_older_than_date = get_past_date(config.JOB_DELETION_DAYS)
    delete_older_than_date_str = delete_older_than_date.isoformat()
    inactive_states = ['expired', 'removed']

    try:
        delete_response = delete_table(
            config.SUPABASE_TABLE_NAME,
            {
                "is_active": ("eq", False),
                "job_state": ("in", inactive_states),
                "scraped_at": ("lt", delete_older_than_date_str),
            },
        )

        deleted_count = len(delete_response) if isinstance(delete_response, list) else 0
        if deleted_count > 0:
            logging.info(f"Successfully deleted {deleted_count} inactive jobs older than {config.JOB_DELETION_DAYS} days.")
        else:
            logging.info("No old inactive jobs found to delete.")
            logging.debug(f"Delete response when no jobs matched: {delete_response}")

    except Exception as e:
        logging.error(f"Error deleting old inactive jobs: {e}")

    logging.info("--- Finished Task: Delete Old Inactive Jobs ---")


# --- Main Execution ---
async def main():
    """Runs the job management tasks."""
    logging.info("Starting Job Management Script...")
    start_time = time.time()

    await mark_expired_jobs()
    await check_linkedin_job_activity()
    await delete_old_inactive_jobs()

    end_time = time.time()
    logging.info(f"Job Management Script finished in {end_time - start_time:.2f} seconds.")

if __name__ == "__main__":
    asyncio.run(main())
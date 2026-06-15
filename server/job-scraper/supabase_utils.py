import json
import logging
from typing import Optional, Any, Dict, List, Union
from urllib.parse import quote

import config
import requests
from models import Resume

def _is_supabase_configured() -> bool:
    if not config.SUPABASE_URL or not config.SUPABASE_SERVICE_ROLE_KEY:
        logging.error(
            "Missing Supabase configuration. Please set SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY "
            "in your environment or in a .env file."
        )
        return False
    return True


def _supabase_urls() -> tuple[str, str]:
    supabase_url = config.SUPABASE_URL.rstrip("/")
    return supabase_url + "/rest/v1", supabase_url + "/storage/v1"


# --- HTTP Helpers ---

def _default_headers(content_type: Optional[str] = "application/json") -> Dict[str, str]:
    if not _is_supabase_configured():
        return {}

    headers = {
        "apikey": config.SUPABASE_SERVICE_ROLE_KEY,
        "Authorization": f"Bearer {config.SUPABASE_SERVICE_ROLE_KEY}",
        "Accept": "application/json",
    }
    if content_type:
        headers["Content-Type"] = content_type
    return headers


def _quote_for_supabase(value: Any) -> str:
    if isinstance(value, bool):
        return "true" if value else "false"
    if value is None:
        return "null"
    text = str(value)
    if any(char in text for char in [" ", ",", "'", '"', "(", ")"]):
        escaped = text.replace('"', '\\"')
        return f'"{escaped}"'
    return text


def _execute_request(
    method: str,
    url: Optional[str],
    params: Optional[Dict[str, str]] = None,
    json_body: Optional[Any] = None,
    data: Optional[bytes] = None,
    headers: Optional[Dict[str, str]] = None,
    allowed_statuses: tuple = (200, 201, 204),
) -> Optional[Any]:
    if not url:
        logging.error("Supabase request canceled because the target URL could not be constructed.")
        return None

    if not _is_supabase_configured():
        return None

    try:
        final_headers = headers or _default_headers()
        response = requests.request(
            method,
            url,
            headers=final_headers,
            params=params,
            json=json_body,
            data=data,
            timeout=getattr(config, "REQUEST_TIMEOUT", 30),
        )

        if response.status_code not in allowed_statuses:
            logging.error(
                f"Supabase HTTP error {response.status_code} for {method} {url}. "
                f"Response: {response.text[:1000]}"
            )
            return None

        if response.status_code == 204:
            return []

        if response.text:
            try:
                return response.json()
            except json.JSONDecodeError:
                logging.warning(f"Could not parse JSON response from Supabase at {url}")
                return response.text
        return None

    except requests.exceptions.RequestException as e:
        logging.error(f"Request exception calling Supabase: {e}")
        return None


def _build_filters(filters: Optional[Dict[str, Any]]) -> Dict[str, str]:
    if not filters:
        return {}

    query: Dict[str, str] = {}
    for field, expression in filters.items():
        if isinstance(expression, tuple) and len(expression) == 2:
            op, value = expression
            if op == "eq":
                query[field] = f"eq.{_quote_for_supabase(value)}"
            elif op == "not_in":
                joined = ",".join(_quote_for_supabase(v) for v in value)
                query[field] = f"not.in.({joined})"
            elif op == "is_null":
                query[field] = "is.null"
            elif op == "not_is_null":
                query[field] = "not.is.null"
            elif op == "gt":
                query[field] = f"gt.{_quote_for_supabase(value)}"
            elif op == "lt":
                query[field] = f"lt.{_quote_for_supabase(value)}"
            elif op == "in":
                joined = ",".join(_quote_for_supabase(v) for v in value)
                query[field] = f"in.({joined})"
            elif op == "not_eq":
                query[field] = f"not.eq.{_quote_for_supabase(value)}"
            else:
                query[field] = f"{op}.{_quote_for_supabase(value)}"
        else:
            query[field] = f"eq.{_quote_for_supabase(expression)}"
    return query


def _table_url(table_name: str) -> Optional[str]:
    if not _is_supabase_configured():
        return None
    rest_url, _ = _supabase_urls()
    return f"{rest_url}/{quote(table_name)}"


def query_table(
    table_name: str,
    select: Optional[str] = None,
    filters: Optional[Dict[str, Any]] = None,
    order: Optional[str] = None,
    limit: Optional[int] = None,
    offset: Optional[int] = None,
) -> Optional[List[Dict[str, Any]]]:
    params: Dict[str, str] = {}
    if select:
        params["select"] = select
    if limit is not None:
        params["limit"] = str(limit)
    if offset is not None:
        params["offset"] = str(offset)
    if order:
        params["order"] = order
    params.update(_build_filters(filters))

    url = _table_url(table_name)
    return _execute_request("GET", url, params=params)


def upsert_table(table_name: str, records: List[Dict[str, Any]]) -> Optional[List[Dict[str, Any]]]:
    url = _table_url(table_name)
    headers = _default_headers()
    headers["Prefer"] = "resolution=merge-duplicates,return=representation"
    return _execute_request("POST", url, headers=headers, json_body=records)


def insert_table(table_name: str, record: Union[Dict[str, Any], List[Dict[str, Any]]]) -> Optional[List[Dict[str, Any]]]:
    url = _table_url(table_name)
    headers = _default_headers()
    headers["Prefer"] = "return=representation"
    body = [record] if isinstance(record, dict) else record
    return _execute_request("POST", url, headers=headers, json_body=body)


def update_table(table_name: str, updates: Dict[str, Any], filters: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    url = _table_url(table_name)
    params = _build_filters(filters)
    headers = _default_headers()
    headers["Prefer"] = "return=representation"
    return _execute_request("PATCH", url, params=params, headers=headers, json_body=updates)


def delete_table(table_name: str, filters: Dict[str, Any]) -> Optional[List[Dict[str, Any]]]:
    url = _table_url(table_name)
    params = _build_filters(filters)
    return _execute_request("DELETE", url, params=params)


def call_rpc(function_name: str, payload: Dict[str, Any]) -> Optional[Any]:
    if not _is_supabase_configured():
        return None
    rest_url, _ = _supabase_urls()
    url = f"{rest_url}/rpc/{quote(function_name)}"
    return _execute_request("POST", url, json_body=payload)


def download_storage_file(bucket_name: str, file_name: str) -> Optional[bytes]:
    if not bucket_name or not file_name:
        logging.error("Both bucket name and file name are required for storage download.")
        return None

    if not _is_supabase_configured():
        return None

    _, storage_url = _supabase_urls()
    url = f"{storage_url}/object/{quote(bucket_name)}/{quote(file_name, safe='/')}"
    headers = _default_headers(content_type=None)
    try:
        response = requests.get(url, headers=headers, timeout=getattr(config, "REQUEST_TIMEOUT", 30))
        if response.status_code == 200:
            return response.content
        logging.error(f"Failed to download file from Supabase Storage: {response.status_code} {response.text[:500]}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"Error downloading file from Supabase Storage: {e}")
        return None


def upload_storage_file(bucket_name: str, destination_path: str, file_content: bytes, content_type: str = "application/pdf") -> bool:
    if not bucket_name or not destination_path or not file_content:
        logging.error("Bucket name, destination path, and file content are all required for storage upload.")
        return False

    if not _is_supabase_configured():
        return False

    _, storage_url = _supabase_urls()
    url = f"{storage_url}/object/{quote(bucket_name)}/{quote(destination_path, safe='/')}"
    params = {"upsert": "true"}
    headers = _default_headers(content_type=content_type)
    try:
        response = requests.post(url, headers=headers, params=params, data=file_content, timeout=getattr(config, "REQUEST_TIMEOUT", 30))
        if response.status_code in (200, 201):
            return True
        logging.error(f"Failed to upload file to Supabase Storage: {response.status_code} {response.text[:500]}")
        return False
    except requests.exceptions.RequestException as e:
        logging.error(f"Error uploading file to Supabase Storage: {e}")
        return False

# --- Supabase Functions ---

def get_existing_jobs_from_supabase(batch_size: int = 1000) -> tuple[set, set]:
    existing_ids = set()
    existing_company_title_keys = set()
    offset = 0

    while True:
        data = query_table(
            config.SUPABASE_TABLE_NAME,
            select="job_id,company,job_title",
            limit=batch_size,
            offset=offset,
        )
        if not data:
            break

        for item in data:
            job_id = item.get("job_id")
            company = item.get("company")
            job_title = item.get("job_title")

            if job_id:
                existing_ids.add(str(job_id))
            if company and job_title:
                normalized_company = company.strip().lower()
                normalized_title = job_title.strip().lower()
                existing_company_title_keys.add((normalized_company, normalized_title))

        offset += batch_size

    logging.info(f"Fetched {len(existing_ids)} job IDs and {len(existing_company_title_keys)} company-title pairs.")
    return existing_ids, existing_company_title_keys


def save_jobs_to_supabase(jobs_data: list):
    if not jobs_data:
        logging.info("No job data provided to save/update.")
        return

    processed_jobs_data = []
    for job in jobs_data:
        if 'job_id' in job and job['job_id'] is not None:
            job['job_id'] = str(job['job_id'])
            processed_jobs_data.append(job)
        else:
            logging.warning(f"Job data missing job_id. Skipping: {job}")

    if not processed_jobs_data:
        logging.info("No valid job data remaining after processing.")
        return

    logging.info(f"Attempting to upsert {len(processed_jobs_data)} jobs to Supabase...")
    result = upsert_table(config.SUPABASE_TABLE_NAME, processed_jobs_data)
    if result is None:
        logging.error("Failed to upsert jobs to Supabase.")
    else:
        logging.info(f"Successfully upserted/updated {len(result)} jobs to Supabase.")


def get_jobs_to_score(limit: int) -> list:
    if limit <= 0:
        logging.warning("Limit for jobs to score must be positive.")
        return []

    data = query_table(
        config.SUPABASE_TABLE_NAME,
        select="job_id,job_title,company,description,level",
        filters={"is_active": ("eq", True), "resume_score": ("is_null", None)},
        order="scraped_at.asc",
        limit=limit,
    )
    return data or []


def get_top_scored_jobs_to_apply(limit: int) -> list:
    if limit <= 0:
        logging.warning("Limit for jobs to apply must be positive.")
        return []

    data = query_table(
        config.SUPABASE_TABLE_NAME,
        select="job_id,job_title,company,resume_score",
        filters={
            "is_active": ("eq", True),
            "status": ("eq", "new"),
            "resume_score": ("not_is_null", None),
        },
        order="resume_score.desc",
        limit=limit,
    )
    return data or []


def get_top_scored_jobs_for_resume_generation(limit: int) -> list:
    if limit <= 0:
        logging.warning("Limit for jobs to apply must be positive.")
        return []

    result = call_rpc("get_jobs_for_resume_generation_custom_sort", {"p_page_number": 1, "p_page_size": limit})
    return result if isinstance(result, list) else []


def get_jobs_to_rescore(limit: int) -> list:
    if limit <= 0:
        logging.warning("Limit for jobs to rescore must be positive.")
        return []

    result = call_rpc("get_jobs_for_rescore", {"p_limit_val": limit})
    return result if isinstance(result, list) else []


def update_job_score(job_id: str, score: int, resume_score_stage: str = "initial") -> bool:
    if not job_id or score is None:
        logging.error(f"Invalid input for updating job score: job_id={job_id}, score={score}")
        return False

    if resume_score_stage not in ["initial", "custom"]:
        logging.error(f"Invalid resume_score_stage: {resume_score_stage}. Must be 'initial' or 'custom'.")
        return False

    result = update_table(
        config.SUPABASE_TABLE_NAME,
        {"resume_score": score, "resume_score_stage": resume_score_stage},
        {"job_id": ("eq", job_id)},
    )
    return result is not None


def get_job_by_id(job_id: str) -> Optional[dict]:
    if not job_id:
        logging.error("No job_id provided to fetch job details.")
        return None

    data = query_table(
        config.SUPABASE_TABLE_NAME,
        select="company,job_title,level,description",
        filters={"job_id": ("eq", job_id)},
        limit=1,
    )
    return data[0] if data else None


def upload_customized_resume_to_storage(file_content: bytes, destination_path: str) -> Optional[str]:
    if not file_content:
        logging.error("Cannot upload empty file content.")
        return None
    if not config.SUPABASE_STORAGE_BUCKET:
        logging.error("Supabase storage bucket name not configured.")
        return None

    if upload_storage_file(config.SUPABASE_STORAGE_BUCKET, destination_path, file_content):
        logging.info(f"Successfully uploaded resume to path: {destination_path}")
        return destination_path
    return None


def update_job_with_resume_link(job_id: str, customized_resume_id: str, new_status: Optional[str] = "resume_generated") -> bool:
    if not job_id or not customized_resume_id:
        logging.error("Job ID and Customized Resume id are required for updating the job.")
        return False

    result = update_table(
        config.SUPABASE_TABLE_NAME,
        {"customized_resume_id": customized_resume_id},
        {"job_id": ("eq", job_id)},
    )
    return result is not None


def save_customized_resume(resume_data: 'Resume', resume_path: str) -> Optional[Any]:
    if not resume_path:
        logging.error("Resume Path is required for saving the resume.")
        return None

    if not resume_data:
        logging.error("No resume data provided to save.")
        return None

    data_to_insert = resume_data.model_dump(exclude_none=True) if hasattr(resume_data, 'model_dump') else resume_data.dict(exclude_none=True)
    data_to_insert['resume_link'] = resume_path

    result = insert_table(config.SUPABASE_CUSTOMIZED_RESUMES_TABLE_NAME, data_to_insert)
    if isinstance(result, list) and result:
        return result[0].get('id')
    return None


def get_customized_resume(resume_id: str) -> Optional[Dict[str, Any]]:
    if not resume_id:
        return None

    data = query_table(
        config.SUPABASE_CUSTOMIZED_RESUMES_TABLE_NAME,
        select="*",
        filters={"id": ("eq", resume_id)},
        limit=1,
    )
    return data[0] if data else None


def download_resume_from_storage(file_name: str = "resume.pdf") -> Optional[bytes]:
    bucket_name = config.SUPABASE_RESUME_STORAGE_BUCKET
    if not bucket_name:
        logging.error("Resume storage bucket name not configured (SUPABASE_RESUME_STORAGE_BUCKET).")
        return None
    return download_storage_file(bucket_name, file_name)


def save_base_resume(resume_data: dict) -> bool:
    if not resume_data:
        logging.error("No resume data provided to save.")
        return False

    delete_table(config.SUPABASE_BASE_RESUME_TABLE_NAME, {"id": ("not_eq", "00000000-0000-0000-0000-000000000000")})
    result = insert_table(config.SUPABASE_BASE_RESUME_TABLE_NAME, {"resume_data": resume_data})
    return result is not None


def get_base_resume() -> Optional[dict]:
    data = query_table(
        config.SUPABASE_BASE_RESUME_TABLE_NAME,
        select="resume_data",
        order="created_at.desc",
        limit=1,
    )
    return data[0].get("resume_data") if data else None

#!/usr/bin/env python3
"""
On-demand job scrape for the Job Portal API.
Usage: python scrape_on_demand.py --query "developer" --location "Singapore" --limit 2
Prints JSON result to stdout.
"""
import argparse
import json
import logging
import sys

import config
from scraper import process_careers_future_query, process_linkedin_query

logging.basicConfig(level=logging.INFO, format="%(asctime)s - %(levelname)s - %(message)s")


def read_existing_ids_from_stdin() -> set:
    existing_ids = set()
    # Check if stdin is not a TTY (indicating piped input)
    if not sys.stdin.isatty():
        try:
            input_data = sys.stdin.read().strip()
            if input_data:
                parsed = json.loads(input_data)
                if isinstance(parsed, list):
                    existing_ids = set(str(x) for x in parsed)
                    logging.info(f"Loaded {len(existing_ids)} existing job IDs from stdin.")
        except Exception as e:
            logging.warning(f"Could not parse existing IDs from stdin: {e}")
    return existing_ids


def run_scrape(query: str, location: str, limit: int, existing_ids: set) -> dict:
    all_jobs = []
    sources = []

    if "linkedin" in config.SCRAPING_SOURCES:
        logging.info(f"Starting LinkedIn scraping for query '{query}'")
        linkedin_jobs = process_linkedin_query(query, location, limit=limit, existing_ids=existing_ids)
        if linkedin_jobs:
            all_jobs.extend(linkedin_jobs)
            sources.append("linkedin")

    if "careers_future" in config.SCRAPING_SOURCES:
        logging.info(f"Starting Careers Future scraping for query '{query}'")
        cf_jobs = process_careers_future_query(query, limit=limit, existing_ids=existing_ids)
        if cf_jobs:
            all_jobs.extend(cf_jobs)
            sources.append("careers_future")

    return {
        "success": True,
        "newJobs": len(all_jobs),
        "query": query,
        "location": location,
        "sources": sources,
        "jobs": all_jobs
    }


def main():
    parser = argparse.ArgumentParser(description="Scrape jobs on demand for Job Portal")
    parser.add_argument("--query", default="software developer", help="Job title / keyword to search")
    parser.add_argument("--location", default=config.LINKEDIN_LOCATION, help="Location for LinkedIn search")
    parser.add_argument("--limit", type=int, default=2, help="Max new jobs per source")
    args = parser.parse_args()

    query = (args.query or "software developer").strip()
    location = (args.location or config.LINKEDIN_LOCATION).strip()

    # Read existing job IDs passed from Node.js process via stdin
    existing_ids = read_existing_ids_from_stdin()

    try:
        result = run_scrape(query, location, args.limit, existing_ids)
    except Exception as exc:
        result = {"success": False, "newJobs": 0, "message": str(exc), "jobs": []}

    print(json.dumps(result))
    sys.exit(0 if result.get("success") else 1)


if __name__ == "__main__":
    main()

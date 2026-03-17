import asyncio
import logging
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Dict, Any

import httpx
from pydantic import BaseModel, Field, field_validator, ValidationError
from tenacity import retry, wait_exponential, stop_after_attempt, retry_if_exception_type

# ---------------------------------------------------------
# 1. LOGGING & SETUP
# ---------------------------------------------------------
# In production, use structlog for JSON logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s"
)
logger = logging.getLogger("MedFusionPipeline")

# ---------------------------------------------------------
# 2. UNIFIED SCHEMA & DATA QUALITY SCORING
# ---------------------------------------------------------
class DiseaseRecord(BaseModel):
    """
    Unified Schema designed for ANY disease, ANY location.
    Handles optional/missing fields gracefully.
    """
    source: str
    disease: str
    location: str
    date: datetime
    cases: Optional[int] = Field(default=0, ge=0)
    deaths: Optional[int] = Field(default=0, ge=0)
    metadata: Dict[str, Any] = Field(default_factory=dict)
    
    # Quality fields
    quality_score: float = 0.0
    fetched_at: datetime = Field(default_factory=lambda: datetime.now(timezone.utc))

    @field_validator("date", mode="before")
    def parse_dates(cls, v):
        if isinstance(v, str):
            try:
                # Attempt standard ISO parsing
                return datetime.fromisoformat(v.replace('Z', '+00:00'))
            except ValueError:
                # Fallback for CDC/WHO weird formats could go here
                pass
        return v

def calculate_quality_score(record: DiseaseRecord, source_reputation: float) -> float:
    """
    Calculates a Data Quality Score (0.0 to 10.0) based on:
    1. Source reputation (e.g., CDC=9.0, ProMED=7.0)
    2. Freshness (newer data is better)
    3. Completeness (are cases/deaths populated?)
    """
    score = source_reputation
    
    # Freshness penalty (lose 0.5 points for every day old, max 5 point penalty)
    days_old = (datetime.now(timezone.utc) - record.date).days
    freshness_penalty = min(5.0, max(0.0, days_old * 0.5))
    score -= freshness_penalty
    
    # Completeness bonus
    if record.cases and record.cases > 0: score += 0.5
    if record.deaths and record.deaths > 0: score += 0.5
    
    return round(max(0.0, min(10.0, score)), 2)

# ---------------------------------------------------------
# 3. ASYNC FETCHING & RETRY LOGIC (CIRCUIT BREAKER PREP)
# ---------------------------------------------------------
class APIFetchError(Exception):
    pass

# Retry only on network/timeout errors, not on 404s (which are permanent)
@retry(
    wait=wait_exponential(multiplier=1, min=2, max=10),
    stop=stop_after_attempt(3),
    retry=retry_if_exception_type((httpx.RequestError, httpx.TimeoutException, APIFetchError))
)
async def fetch_cdc_covid(client: httpx.AsyncClient) -> List[DiseaseRecord]:
    """Adapter for CDC Open Data with robust async fetching."""
    url = "https://data.cdc.gov/resource/vbim-akqf.json"
    logger.info(f"Fetching {url}...")
    
    try:
        response = await client.get(url, params={"$limit": 50}, timeout=10.0)
        response.raise_for_status()
    except httpx.HTTPStatusError as e:
        if e.response.status_code == 404:
            logger.error(f"CDC Endpoint deprecated (404). Disabling source.")
            return [] # Do not retry 404s
        raise APIFetchError(f"HTTP Error: {e.response.status_code}")
        
    data = response.json()
    if not isinstance(data, list):
        logger.warning(f"CDC Schema drift: Expected list, got {type(data)}")
        return []

    records = []
    for item in data:
        try:
            # Mapping external schema to unified schema
            rec = DiseaseRecord(
                source="CDC Open Data",
                disease="COVID-19",
                location=item.get("res_state", "Unknown"),
                date=item.get("cdc_report_dt", datetime.now(timezone.utc)),
                cases=1, # CDC line-level data usually represents 1 case per row
                metadata={"age_group": item.get("age_group")}
            )
            rec.quality_score = calculate_quality_score(rec, source_reputation=9.5)
            records.append(rec)
        except ValidationError as e:
            logger.debug(f"Skipping invalid CDC record: {e}")
            
    return records

# ---------------------------------------------------------
# 4. CONFLICT RESOLUTION ENGINE
# ---------------------------------------------------------
def resolve_conflicts(records: List[DiseaseRecord]) -> List[DiseaseRecord]:
    """
    Groups records by (disease, location, date).
    If multiple sources report the same disease/location/date, 
    it picks the one with the highest Data Quality Score.
    """
    grouped = {}
    for r in records:
        # Normalize date to day-level for deduplication
        key = (r.disease.lower(), r.location.lower(), r.date.strftime("%Y-%m-%d"))
        if key not in grouped:
            grouped[key] = r
        else:
            # Conflict detected! Compare quality scores.
            if r.quality_score > grouped[key].quality_score:
                logger.info(f"Conflict Resolved: Picked {r.source} ({r.quality_score}) over {grouped[key].source} ({grouped[key].quality_score}) for {key}")
                grouped[key] = r
                
    return list(grouped.values())

# ---------------------------------------------------------
# 5. MAIN PIPELINE ORCHESTRATOR
# ---------------------------------------------------------
async def run_pipeline():
    """Orchestrates concurrent fetching, validation, and resolution."""
    logger.info("Starting Async Data Pipeline...")
    
    # Use a connection pool (AsyncClient) for efficiency
    # Limits concurrent connections to prevent overwhelming OS resources
    limits = httpx.Limits(max_keepalive_connections=5, max_connections=10)
    
    async with httpx.AsyncClient(limits=limits, verify=False) as client:
        # asyncio.gather runs all fetchers concurrently!
        # return_exceptions=True acts as a circuit breaker boundary; 
        # one failing source won't crash the others.
        results = await asyncio.gather(
            fetch_cdc_covid(client),
            # fetch_who(client),
            # fetch_disease_sh(client),
            return_exceptions=True
        )
        
    all_records = []
    for result in results:
        if isinstance(result, Exception):
            logger.error(f"Source failed completely after retries: {result}")
        elif isinstance(result, list):
            all_records.extend(result)
            
    # Resolve conflicts before saving to DB
    final_dataset = resolve_conflicts(all_records)
    logger.info(f"Pipeline complete. Yielded {len(final_dataset)} verified records.")
    return final_dataset

if __name__ == "__main__":
    asyncio.run(run_pipeline())
"""
MedFusion — FastAPI Backend
6 External Sources + 6 Unified APIs + Intelligence Layer

Run: uvicorn main:app --reload --port 8000
"""

from fastapi import FastAPI, Query, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import datetime, timezone

import cache
import intelligence as intel

from connectors import (
    connector_diseasesh_current as ds_current,
    connector_diseasesh_historical as ds_historical,
    connector_who_gho as who,
    connector_cdc as cdc,
    connector_fluview as fluview,
    connector_promed as promed,
)

app = FastAPI(
    title="MedFusion Disease Surveillance API",
    description="Unified disease surveillance dashboard API integrating 6 public health sources",
    version="1.0.0",
)

# Allow frontend (Vite dev server) to call this API
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://localhost:3000", "*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─────────────────────────────────────────────
# Helpers
# ─────────────────────────────────────────────

def _source_meta(name: str, url: str, fetched_at: str, status: str) -> dict:
    return {
        "source_name": name,
        "source_url": url,
        "fetched_at": fetched_at,
        "status": status,
    }


# ─────────────────────────────────────────────
# API 1: /api/overview
# Primary KPI cards — global snapshot
# ─────────────────────────────────────────────

@app.get("/api/overview")
def get_overview():
    """
    Global disease overview KPIs.
    Sources: disease.sh (current), CDC (US totals)
    """
    cached = cache.get("overview")
    if cached:
        return cached

    ds = ds_current.fetch()
    cdc_data = cdc.fetch(limit=60)

    data = ds.get("data") or {}
    us_states = cdc_data.get("data", {}) or {}
    all_latest = us_states.get("all_latest", [])

    us_total_cases = sum(s.get("total_cases") or 0 for s in all_latest)
    us_new_cases = sum(s.get("new_cases") or 0 for s in all_latest)
    us_total_deaths = sum(s.get("total_deaths") or 0 for s in all_latest)

    result = {
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
        "global": {
            "cases": data.get("cases"),
            "deaths": data.get("deaths"),
            "recovered": data.get("recovered"),
            "active": data.get("active"),
            "critical": data.get("critical"),
            "today_cases": data.get("today_cases"),
            "today_deaths": data.get("today_deaths"),
            "cases_per_million": data.get("cases_per_million"),
            "affected_countries": data.get("affected_countries"),
            "population": data.get("population"),
        },
        "us": {
            "total_cases": us_total_cases,
            "new_cases_today": us_new_cases,
            "total_deaths": us_total_deaths,
            "states_covered": us_states.get("states_covered"),
        },
        "sources": [
            _source_meta(ds["source"], ds["source_url"], ds["fetched_at"], ds["status"]),
            _source_meta(cdc_data["source"], cdc_data["source_url"], cdc_data["fetched_at"], cdc_data["status"]),
        ],
    }

    cache.set("overview", result, ttl=300)
    return result


# ─────────────────────────────────────────────
# API 2: /api/trends
# Time-series data for line charts
# ─────────────────────────────────────────────

@app.get("/api/trends")
def get_trends(days: int = Query(default=90, ge=7, le=365)):
    """
    Historical case/death/recovered trend for line charts.
    Source: disease.sh (historical)
    """
    key = f"trends_{days}"
    cached = cache.get(key)
    if cached:
        return cached

    hist = ds_historical.fetch(lastdays=days)
    hist_data = hist.get("data") or {}
    timeline = hist_data.get("timeline", [])

    # Compute trend intelligence
    trend_info = intel.trend_from_timeline(timeline, key="cases", window=7)

    result = {
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
        "days": days,
        "timeline": timeline,
        "meta": {
            "earliest_date": hist_data.get("earliest_date"),
            "latest_date": hist_data.get("latest_date"),
            "total_points": hist_data.get("total_points"),
        },
        "intelligence": {
            "case_trend": trend_info,
        },
        "sources": [
            _source_meta(hist["source"], hist["source_url"], hist["fetched_at"], hist["status"]),
        ],
    }

    cache.set(key, result, ttl=600)
    return result


# ─────────────────────────────────────────────
# API 3: /api/spread
# Regional / state-level spread for bar charts
# ─────────────────────────────────────────────

@app.get("/api/spread")
def get_spread():
    """
    US state-level and WHO regional spread data.
    Sources: CDC Open Data, WHO GHO
    """
    cached = cache.get("spread")
    if cached:
        return cached

    cdc_data = cdc.fetch(limit=200)
    who_data = who.fetch()

    cdc_d = cdc_data.get("data") or {}
    who_d = who_data.get("data") or {}

    top_states = cdc_d.get("top_states_by_new_cases", [])
    hotspots = intel.detect_hotspots(top_states, new_cases_key="new_cases", top_n=10)

    result = {
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
        "us_states": {
            "top_by_new_cases": top_states,
            "hotspots": hotspots,
            "states_covered": cdc_d.get("states_covered"),
        },
        "who_regions": {
            "life_expectancy_by_region": who_d.get("region_averages", {}),
            "records_fetched": who_d.get("records_fetched"),
        },
        "sources": [
            _source_meta(cdc_data["source"], cdc_data["source_url"], cdc_data["fetched_at"], cdc_data["status"]),
            _source_meta(who_data["source"], who_data["source_url"], who_data["fetched_at"], who_data["status"]),
        ],
    }

    cache.set("spread", result, ttl=300)
    return result


# ─────────────────────────────────────────────
# API 4: /api/alerts
# Outbreak alerts from ProMED + flu signals from FluView
# ─────────────────────────────────────────────

@app.get("/api/alerts")
def get_alerts(limit: int = Query(default=15, ge=1, le=50)):
    """
    Real-time outbreak alerts from ProMED RSS + CDC FluView.
    Sources: ProMED-mail RSS, CDC FluView
    """
    cached = cache.get("alerts")
    if cached:
        return cached

    promed_data = promed.fetch(max_items=limit)
    flu_data = fluview.fetch()

    promed_d = promed_data.get("data") or {}
    flu_d = flu_data.get("data") or {}

    alerts = promed_d.get("alerts", [])
    high_alerts = [a for a in alerts if a.get("severity") == "high"]
    medium_alerts = [a for a in alerts if a.get("severity") == "medium"]

    result = {
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
        "summary": {
            "total_alerts": promed_d.get("total_alerts", 0),
            "high_severity": len(high_alerts),
            "medium_severity": len(medium_alerts),
            "diseases_mentioned": promed_d.get("diseases_mentioned", []),
        },
        "alerts": alerts,
        "flu": {
            "network": flu_d.get("network"),
            "latest_avg_ili_pct": flu_d.get("latest_week_avg_ili_pct"),
            "weekly_records": (flu_d.get("records") or [])[:10],
            "status": flu_data.get("status"),
        },
        "sources": [
            _source_meta(promed_data["source"], promed_data["source_url"], promed_data["fetched_at"], promed_data["status"]),
            _source_meta(flu_data["source"], flu_data["source_url"], flu_data["fetched_at"], flu_data["status"]),
        ],
    }

    cache.set("alerts", result, ttl=180)
    return result


# ─────────────────────────────────────────────
# API 5: /api/intelligence
# Unified intelligence summary across all sources
# ─────────────────────────────────────────────

@app.get("/api/intelligence")
def get_intelligence():
    """
    Cross-source intelligence: trend classification, risk level, hotspots, alert signals.
    Sources: All 6 connectors aggregated.
    """
    cached = cache.get("intelligence")
    if cached:
        return cached

    # Pull from other APIs (they handle their own caching)
    overview_resp = get_overview()
    trends_resp = get_trends(days=30)
    spread_resp = get_spread()
    alerts_resp = get_alerts()

    global_data = overview_resp.get("global", {})
    trend_info = trends_resp.get("intelligence", {}).get("case_trend", {})
    hotspots = spread_resp.get("us_states", {}).get("hotspots", [])
    all_alerts = alerts_resp.get("alerts", [])

    summary = intel.build_intelligence_summary(
        overview=global_data,
        trend_info=trend_info,
        hotspots=hotspots,
        alerts=all_alerts,
    )

    result = {
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
        "intelligence": summary,
        "detail": {
            "global_active_cases": global_data.get("active"),
            "global_population": global_data.get("population"),
            "trend_window_days": trend_info.get("window_days"),
            "pct_change_7d": trend_info.get("pct_change"),
            "risk_level": summary.get("risk_level"),
            "top_hotspots": summary.get("top_hotspots"),
            "high_alerts": summary.get("high_alert_count"),
        },
        "sources_used": [
            "disease.sh (current)",
            "disease.sh (historical)",
            "CDC Open Data",
            "CDC FluView",
            "ProMED-mail RSS",
            "WHO GHO API",
        ],
    }

    cache.set("intelligence", result, ttl=300)
    return result


# ─────────────────────────────────────────────
# API 6: /api/search
# Search by disease name or country/region
# ─────────────────────────────────────────────

@app.get("/api/search")
def search(
    q: str = Query(..., min_length=1, description="Disease name, country, or region to search"),
    type: str = Query(default="country", enum=["country", "disease", "alert"]),
):
    """
    Search by country name (COVID stats), disease keyword (alerts), or region.
    Sources: disease.sh per-country, ProMED alerts.
    """
    q_lower = q.strip().lower()

    if type == "country":
        # Fetch country-specific data from disease.sh
        url = f"https://disease.sh/v3/covid-19/countries/{q}"
        try:
            import requests as _requests
            resp = _requests.get(url, timeout=10)
            if resp.status_code == 404:
                raise HTTPException(status_code=404, detail=f"Country '{q}' not found.")
            resp.raise_for_status()
            raw = resp.json()

            return {
                "query": q,
                "type": type,
                "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
                "result": {
                    "country": raw.get("country"),
                    "flag": raw.get("countryInfo", {}).get("flag"),
                    "cases": raw.get("cases"),
                    "today_cases": raw.get("todayCases"),
                    "deaths": raw.get("deaths"),
                    "today_deaths": raw.get("todayDeaths"),
                    "recovered": raw.get("recovered"),
                    "active": raw.get("active"),
                    "critical": raw.get("critical"),
                    "cases_per_million": raw.get("casesPerOneMillion"),
                    "population": raw.get("population"),
                    "continent": raw.get("continent"),
                },
                "source": "disease.sh",
                "source_url": url,
            }
        except HTTPException:
            raise
        except Exception as e:
            raise HTTPException(status_code=502, detail=f"Source error: {str(e)}")

    elif type == "alert":
        # Search ProMED alerts by keyword
        promed_data = promed.fetch(max_items=50)
        alerts = (promed_data.get("data") or {}).get("alerts", [])
        matched = [
            a for a in alerts
            if q_lower in (a.get("title") or "").lower()
            or q_lower in (a.get("summary") or "").lower()
            or q_lower in (a.get("disease") or "").lower()
        ]
        return {
            "query": q,
            "type": type,
            "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
            "matches": len(matched),
            "results": matched[:10],
            "source": "ProMED-mail RSS",
        }

    elif type == "disease":
        # Search WHO GHO by keyword across known indicators
        who_data = who.fetch()
        records = (who_data.get("data") or {}).get("records", [])
        matched = [
            r for r in records
            if q_lower in str(r).lower()
        ]
        return {
            "query": q,
            "type": type,
            "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
            "matches": len(matched),
            "results": matched[:10],
            "source": "WHO GHO API",
        }

    raise HTTPException(status_code=400, detail="Invalid search type")


# ─────────────────────────────────────────────
# Health + Meta endpoints
# ─────────────────────────────────────────────

@app.get("/")
def root():
    return {
        "name": "MedFusion Disease Surveillance API",
        "version": "1.0.0",
        "endpoints": [
            "/api/overview",
            "/api/trends",
            "/api/spread",
            "/api/alerts",
            "/api/intelligence",
            "/api/search",
        ],
        "sources": [
            "disease.sh (current + historical)",
            "WHO GHO API",
            "CDC Open Data",
            "CDC FluView",
            "ProMED-mail RSS",
        ],
    }


@app.get("/api/sources")
def get_sources():
    """Return provenance and freshness info for all 6 integrated sources."""
    return {
        "fetched_at": datetime.now(tz=timezone.utc).isoformat(),
        "cache_stats": cache.stats(),
        "sources": [
            {
                "name": "disease.sh (current)",
                "url": "https://disease.sh/v3/covid-19/all",
                "type": "REST API",
                "data": "Global COVID-19 current snapshot",
                "update_frequency": "~10 minutes",
                "internal_api": "/api/overview",
            },
            {
                "name": "disease.sh (historical)",
                "url": "https://disease.sh/v3/covid-19/historical/all",
                "type": "REST API",
                "data": "90-day global COVID timeline",
                "update_frequency": "Daily",
                "internal_api": "/api/trends",
            },
            {
                "name": "WHO GHO API",
                "url": "https://ghoapi.azureedge.net/api",
                "type": "REST API (OData)",
                "data": "Global health indicators by country/region",
                "update_frequency": "Annual/quarterly",
                "internal_api": "/api/spread",
            },
            {
                "name": "CDC Open Data",
                "url": "https://data.cdc.gov/resource/9mfq-cb36.json",
                "type": "Socrata REST API",
                "data": "US state-level COVID cases + deaths",
                "update_frequency": "Daily",
                "internal_api": "/api/spread",
            },
            {
                "name": "CDC FluView",
                "url": "https://gis.cdc.gov/grasp/flu2/GetFlu2Data",
                "type": "POST API (ILINet)",
                "data": "US weekly influenza surveillance",
                "update_frequency": "Weekly (Fridays)",
                "internal_api": "/api/alerts",
            },
            {
                "name": "ProMED-mail RSS",
                "url": "https://promedmail.org/feed/",
                "type": "RSS Feed",
                "data": "Global infectious disease outbreak alerts",
                "update_frequency": "Near-real-time",
                "internal_api": "/api/alerts",
            },
        ],
    }


@app.get("/health")
def health():
    return {"status": "ok", "timestamp": datetime.now(tz=timezone.utc).isoformat()}

"""
Intelligence Engine — Rule-Based Analysis
Logic: rising / stable / declining + hotspot detection
No ML, no LLM — pure delta math.
"""

from typing import Optional


def classify_trend(current: Optional[float], previous: Optional[float], threshold_pct: float = 10.0) -> str:
    """
    Classify trend as 'rising', 'declining', or 'stable'
    based on percentage change between two values.
    """
    if current is None or previous is None or previous == 0:
        return "unknown"

    pct_change = ((current - previous) / abs(previous)) * 100

    if pct_change > threshold_pct:
        return "rising"
    elif pct_change < -threshold_pct:
        return "declining"
    else:
        return "stable"


def trend_from_timeline(timeline: list, key: str = "cases", window: int = 7) -> dict:
    """
    Given a list of {date, cases, deaths, recovered},
    compute recent trend using last `window` days vs prior `window` days.
    """
    if not timeline or len(timeline) < window * 2:
        return {"trend": "unknown", "pct_change": None, "direction": None}

    # Sort by date ascending
    sorted_tl = sorted(timeline, key=lambda x: x.get("date", ""))

    recent = sorted_tl[-window:]
    prior = sorted_tl[-(window * 2):-window]

    recent_avg = _safe_avg([r.get(key) for r in recent])
    prior_avg = _safe_avg([r.get(key) for r in prior])

    trend = classify_trend(recent_avg, prior_avg)

    pct_change = None
    if recent_avg is not None and prior_avg and prior_avg != 0:
        pct_change = round(((recent_avg - prior_avg) / abs(prior_avg)) * 100, 1)

    return {
        "trend": trend,
        "pct_change": pct_change,
        "recent_avg": round(recent_avg, 1) if recent_avg else None,
        "prior_avg": round(prior_avg, 1) if prior_avg else None,
        "window_days": window,
        "direction": "↑" if trend == "rising" else "↓" if trend == "declining" else "→",
    }


def detect_hotspots(state_data: list, new_cases_key: str = "new_cases", top_n: int = 5) -> list:
    """
    Given list of state records, return top N hotspots by new case count.
    """
    valid = [s for s in state_data if s.get(new_cases_key) is not None]
    sorted_states = sorted(valid, key=lambda x: x[new_cases_key], reverse=True)
    return sorted_states[:top_n]


def risk_level(active_cases: Optional[int], population: Optional[int]) -> str:
    """
    Assign a risk level based on active cases per million population.
    """
    if active_cases is None or population is None or population == 0:
        return "unknown"

    per_million = (active_cases / population) * 1_000_000

    if per_million > 5000:
        return "critical"
    elif per_million > 1000:
        return "high"
    elif per_million > 100:
        return "moderate"
    else:
        return "low"


def build_intelligence_summary(overview: dict, trend_info: dict, hotspots: list, alerts: list) -> dict:
    """
    Combine all signals into a single intelligence summary block.
    """
    active = overview.get("active")
    population = overview.get("population")
    rl = risk_level(active, population)

    high_alerts = [a for a in alerts if a.get("severity") == "high"]

    trend = trend_info.get("trend", "unknown")
    direction = trend_info.get("direction", "→")
    pct_change = trend_info.get("pct_change")

    pct_str = f"{abs(pct_change)}%" if pct_change is not None else "N/A"
    trend_sentence = f"Cases are {trend} ({direction} {pct_str} over 7d)."

    alert_sentence = (
        f"{len(high_alerts)} high-severity outbreak alert(s) active."
        if high_alerts
        else "No high-severity alerts detected."
    )

    hotspot_names = [h.get("state", h.get("country", "?")) for h in hotspots[:3]]
    hotspot_sentence = f"Top hotspots: {', '.join(hotspot_names)}." if hotspot_names else ""

    return {
        "risk_level": rl,
        "trend": trend,
        "trend_direction": direction,
        "pct_change_7d": pct_change,
        "high_alert_count": len(high_alerts),
        "top_hotspots": hotspot_names,
        "summary_text": f"{trend_sentence} {alert_sentence} {hotspot_sentence}".strip(),
        "signals": {
            "case_trend": trend,
            "risk_level": rl,
            "active_alerts": len(high_alerts),
            "hotspot_count": len(hotspots),
        },
    }


def _safe_avg(values: list) -> Optional[float]:
    valid = [v for v in values if v is not None]
    if not valid:
        return None
    return sum(float(v) for v in valid) / len(valid)

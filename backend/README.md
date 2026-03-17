# MedFusion — Backend

## Structure

```
backend/
├── main.py                          # FastAPI app — all 6 APIs
├── intelligence.py                  # Rule-based trend/hotspot/risk logic
├── cache.py                         # In-memory TTL cache
├── requirements.txt
└── connectors/
    ├── connector_diseasesh_current.py    # Source 1 — disease.sh current
    ├── connector_diseasesh_historical.py # Source 2 — disease.sh historical
    ├── connector_who_gho.py              # Source 3 — WHO GHO API
    ├── connector_cdc.py                  # Source 4 — CDC Open Data
    ├── connector_fluview.py              # Source 5 — CDC FluView (flu)
    └── connector_promed.py               # Source 6 — ProMED RSS alerts
```

## Setup

```bash
cd backend
pip install -r requirements.txt
uvicorn main:app --reload --port 8000
```

## All APIs

| Endpoint | Description | Sources |
|---|---|---|
| `GET /api/overview` | Global KPI snapshot | disease.sh, CDC |
| `GET /api/trends?days=90` | Time-series for charts | disease.sh historical |
| `GET /api/spread` | State/regional spread | CDC, WHO |
| `GET /api/alerts` | Outbreak alerts + flu | ProMED, FluView |
| `GET /api/intelligence` | Trend + risk + hotspots | All 6 combined |
| `GET /api/search?q=india&type=country` | Search by country/disease | disease.sh, ProMED, WHO |
| `GET /api/sources` | Source provenance + freshness | Meta |
| `GET /health` | Health check | — |

## Intelligence Logic

- **Trend**: Compare 7-day avg vs prior 7-day avg → `rising / stable / declining`
- **Risk level**: Active cases per million → `low / moderate / high / critical`
- **Hotspots**: Top N states by new case count
- **Alerts**: ProMED severity tagged by keyword matching

## Cache TTL

| Data | TTL |
|---|---|
| Overview (current stats) | 5 min |
| Trends (historical) | 10 min |
| Spread (regional) | 5 min |
| Alerts (ProMED + flu) | 3 min |
| Intelligence (computed) | 5 min |

## Notes

- No database — all in-memory cache + live fetch
- All connectors handle their own errors and return `{"status": "error"}` gracefully
- CORS is open for localhost:5173 (Vite) and localhost:3000

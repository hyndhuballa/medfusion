# MedFusion Surveillance Hub

**Integrated Disease Intelligence Platform** — A production-grade, real-time epidemiological surveillance console built with Next.js 15, TypeScript, Tailwind CSS, and Recharts.

---

## Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Language | TypeScript |
| Styling | Tailwind CSS |
| Charts | Recharts |
| State | React hooks (no external state lib) |

---

## Project Structure

```
medfusion/
├── app/
│   ├── globals.css        # Global styles, CSS variables, fonts
│   ├── layout.tsx         # Root layout + metadata
│   └── page.tsx           # Main surveillance page (orchestrator)
├── components/
│   ├── Header.tsx         # Fixed top header with live timestamp
│   ├── QueryLayer.tsx     # Search bar + filter controls
│   ├── KpiStrip.tsx       # 5-card KPI row
│   ├── TrendChart.tsx     # Recharts time-series area chart
│   ├── IntelligencePanel.tsx  # Plain-language AI assessment + risk meters
│   ├── RegionalSpread.tsx # Ranked region list with inline bars
│   ├── AlertFeed.tsx      # Live-streaming alert feed
│   ├── OutbreakTimeline.tsx   # Chronological event timeline
│   ├── DataSourceMonitor.tsx  # 6-source status grid
│   └── Panel.tsx          # Shared panel/card layout primitive
├── hooks/
│   └── useSurveillance.ts # Data fetching hook with auto-refresh
├── lib/
│   ├── api.ts             # API client (falls back to mock data)
│   ├── mockData.ts        # Complete mock dataset
│   └── utils.ts           # Formatting helpers
├── types/
│   └── index.ts           # All TypeScript interfaces
├── .env.example           # Environment variable template
├── tailwind.config.ts
├── tsconfig.json
└── next.config.ts
```

---

## Getting Started

```bash
# 1. Install dependencies
npm install

# 2. Configure environment (optional — mock data works without it)
cp .env.example .env.local
# Edit .env.local and set NEXT_PUBLIC_API_BASE_URL

# 3. Run development server
npm run dev

# 4. Open in browser
# http://localhost:3000
```

---

## Connecting to the MedFest Backend

Set `NEXT_PUBLIC_API_BASE_URL` in `.env.local` to your running backend:

```env
NEXT_PUBLIC_API_BASE_URL=http://localhost:8000
```

The API client in `lib/api.ts` maps to these endpoints:

| Function | Endpoint |
|---|---|
| `fetchDiseaseStats(disease)` | `GET /disease/{name}` |
| `fetchTrendData(disease, range)` | `GET /disease/{name}/trend?range=30d` |
| `fetchRegionalData(disease)` | `GET /graph/{disease}` |
| `fetchAlerts(disease)` | `GET /disease/{name}/alerts` |
| `fetchTimeline(disease)` | `GET /disease/{name}/timeline` |
| `fetchGenes(disease)` | `GET /genes/{disease}` |
| `fetchDrugs(disease)` | `GET /drugs/{disease}` |
| `fetchPapers(disease)` | `GET /papers/{disease}` |

When the API is unreachable or `NEXT_PUBLIC_API_BASE_URL` is unset, all functions silently fall back to the mock data in `lib/mockData.ts`.

---

## Design System

- **Dark theme**: deep slate (`#0a0d12`) base, layered panel surfaces
- **Typography**: IBM Plex Mono (data/labels) + IBM Plex Sans (prose)
- **Semantic colors**: Red → high risk · Amber → warning · Green → stable · Blue → informational
- **No gradients, no glassmorphism** — flat, high-contrast surfaces only

---

## Auto-Refresh

The `useSurveillance` hook auto-refreshes all data every **5 minutes**. The alert feed additionally simulates live ingestion with a new auto-generated alert every **18 seconds** to demonstrate streaming behavior.

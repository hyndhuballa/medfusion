import type {
  DiseaseStats,
  TrendDataPoint,
  RegionData,
  AlertItem,
  TimelineEvent,
  DataSource,
  TimeRange,
} from "@/types";

// ─── Utility ─────────────────────────────────────────────────────────────────

function daysAgo(n: number): Date {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d;
}

function formatDate(d: Date): string {
  return d.toLocaleDateString("en-GB", { month: "short", day: "numeric" });
}

function generateTrend(days: number, base: number, growthRate: number): number[] {
  const data: number[] = [];
  let v = base;
  for (let i = days - 1; i >= 0; i--) {
    v = v * (1 + growthRate + (Math.random() - 0.45) * 0.02);
    data.push(Math.round(v));
  }
  return data;
}

// ─── Mock Disease Stats ───────────────────────────────────────────────────────

export const MOCK_DISEASE_STATS: DiseaseStats = {
  name: "Dengue",
  totalCases: 84291,
  activeCases: 31048,
  growthRate: 2.8,
  alertCount: 7,
  riskLevel: "HIGH",
  cfr: 0.8,
  lastUpdated: new Date().toISOString(),
};

// ─── Mock Trend Data ──────────────────────────────────────────────────────────

export function generateTrendData(timeRange: TimeRange): TrendDataPoint[] {
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const confirmed = generateTrend(days, 1800, 0.038);
  const suspected = generateTrend(days, 2400, 0.032);
  const recovered = generateTrend(days, 1200, 0.03);
  const deaths = generateTrend(days, 14, 0.01);

  return Array.from({ length: days }, (_, i) => ({
    date: formatDate(daysAgo(days - 1 - i)),
    confirmed: confirmed[i],
    suspected: suspected[i],
    recovered: recovered[i],
    deaths: deaths[i],
  }));
}

// ─── Mock Regions ─────────────────────────────────────────────────────────────

export const MOCK_REGIONS: RegionData[] = [
  { name: "India", country: "IN", activeCases: 18400, totalCases: 42100, growthPct: 18.2, rank: 1 },
  { name: "Brazil", country: "BR", activeCases: 14200, totalCases: 33800, growthPct: 6.4, rank: 2 },
  { name: "Philippines", country: "PH", activeCases: 9800, totalCases: 21200, growthPct: 11.1, rank: 3 },
  { name: "Bangladesh", country: "BD", activeCases: 7600, totalCases: 16400, growthPct: 22.0, rank: 4 },
  { name: "Colombia", country: "CO", activeCases: 5900, totalCases: 12100, growthPct: 5.8, rank: 5 },
  { name: "Vietnam", country: "VN", activeCases: 4800, totalCases: 10300, growthPct: 9.3, rank: 6 },
  { name: "Thailand", country: "TH", activeCases: 4100, totalCases: 8900, growthPct: 3.1, rank: 7 },
  { name: "Mexico", country: "MX", activeCases: 3700, totalCases: 7800, growthPct: -1.4, rank: 8 },
  { name: "Indonesia", country: "ID", activeCases: 3200, totalCases: 7100, growthPct: 7.8, rank: 9 },
  { name: "Pakistan", country: "PK", activeCases: 2900, totalCases: 6200, growthPct: 14.2, rank: 10 },
];

// ─── Mock Alerts ──────────────────────────────────────────────────────────────

export const MOCK_ALERTS: AlertItem[] = [
  {
    id: "a1",
    severity: "critical",
    title: "Unusual mortality spike detected in Dhaka district — CFR exceeded 2.1% threshold",
    source: "WHO",
    timestamp: "14 min ago",
    tag: "critical",
    region: "Bangladesh",
    disease: "Dengue",
  },
  {
    id: "a2",
    severity: "high",
    title: "Novel serotype DENV-5 variant reported across 3 Southeast Asian countries",
    source: "ProMED",
    timestamp: "38 min ago",
    tag: "warning",
    disease: "Dengue",
  },
  {
    id: "a3",
    severity: "high",
    title: "Healthcare system capacity alert: ICU occupancy >85% in Mumbai metropolitan area",
    source: "ECDC",
    timestamp: "1h 12m ago",
    tag: "warning",
    region: "India",
  },
  {
    id: "a4",
    severity: "medium",
    title: "Cross-border spread confirmed between Bangladesh and West Bengal state",
    source: "CDC",
    timestamp: "2h 44m ago",
    tag: "info",
  },
  {
    id: "a5",
    severity: "medium",
    title: "FluView reporting elevated dengue co-infections with influenza A (H3N2)",
    source: "FluView",
    timestamp: "4h 01m ago",
    tag: "info",
  },
  {
    id: "a6",
    severity: "medium",
    title: "Vector surveillance: Aedes aegypti population density above seasonal mean in 12 cities",
    source: "disease.sh",
    timestamp: "5h 30m ago",
    tag: "info",
  },
  {
    id: "a7",
    severity: "low",
    title: "Vaccination coverage update: 2024 dengue vaccine program reaching 43% target populations",
    source: "WHO",
    timestamp: "7h ago",
    tag: "info",
  },
];

// ─── Mock Timeline ────────────────────────────────────────────────────────────

export const MOCK_TIMELINE: TimelineEvent[] = [
  {
    id: "t1",
    date: "Jan 2025",
    event: "WHO declares heightened surveillance posture",
    description: "Global alert level raised following Q4 2024 surge analysis. All member states requested to activate enhanced reporting protocols.",
    severity: "red",
  },
  {
    id: "t2",
    date: "Nov 2024",
    event: "DENV-5 variant sequence published",
    description: "Novel variant identified in Philippine national genomics lab; flagged for monitoring and shared via GISAID network.",
    severity: "amber",
  },
  {
    id: "t3",
    date: "Sep 2024",
    event: "South Asia monsoon amplification event",
    description: "Cases doubled in 18-day window across India and Bangladesh during peak monsoon season. Emergency response teams deployed.",
    severity: "red",
  },
  {
    id: "t4",
    date: "Jul 2024",
    event: "Brazil seasonal peak confirmed",
    description: "Southern hemisphere winter surge aligned with historical patterns; 14,200 cases reported across 11 states.",
    severity: "amber",
  },
  {
    id: "t5",
    date: "Apr 2024",
    event: "Regional coordination protocol activated",
    description: "SEARO and AMRO convene joint response taskforce for cross-border data sharing and resource coordination.",
    severity: "blue",
  },
  {
    id: "t6",
    date: "Jan 2024",
    event: "Baseline surveillance period begins",
    description: "Interseason monitoring initiated across all WHO reporting regions. Data integration with disease.sh completed.",
    severity: "neutral",
  },
];

// ─── Mock Data Sources ────────────────────────────────────────────────────────

export const MOCK_SOURCES: DataSource[] = [
  { id: "who", name: "WHO", status: "online", lastUpdated: "4 min ago", recordCount: "1.2M datapoints", endpoint: "https://who.int/api" },
  { id: "cdc", name: "CDC", status: "online", lastUpdated: "8 min ago", recordCount: "847K datapoints", endpoint: "https://data.cdc.gov" },
  { id: "fluview", name: "FluView", status: "degraded", lastUpdated: "42 min ago", recordCount: "312K datapoints", endpoint: "https://gis.cdc.gov/fluview" },
  { id: "promed", name: "ProMED", status: "online", lastUpdated: "6 min ago", recordCount: "96K reports", endpoint: "https://promedmail.org/api" },
  { id: "diseasesh", name: "disease.sh", status: "online", lastUpdated: "2 min ago", recordCount: "Real-time API", endpoint: "https://disease.sh/v3" },
  { id: "ecdc", name: "ECDC", status: "online", lastUpdated: "11 min ago", recordCount: "204K datapoints", endpoint: "https://ecdc.europa.eu/api" },
];

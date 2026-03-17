// ─── Disease / API Types ────────────────────────────────────────────────────

export interface DiseaseStats {
  name: string;
  totalCases: number;
  activeCases: number;
  growthRate: number;
  alertCount: number;
  riskLevel: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  cfr: number; // case fatality rate %
  lastUpdated: string;
}

export interface TrendDataPoint {
  date: string;
  confirmed: number;
  suspected: number;
  recovered: number;
  deaths: number;
}

export interface RegionData {
  name: string;
  country: string;
  activeCases: number;
  totalCases: number;
  growthPct: number;
  rank: number;
}

export interface AlertItem {
  id: string;
  severity: "critical" | "high" | "medium" | "low";
  title: string;
  source: AlertSource;
  timestamp: string;
  tag: "critical" | "warning" | "info";
  region?: string;
  disease?: string;
}

export interface TimelineEvent {
  id: string;
  date: string;
  event: string;
  description: string;
  severity: "red" | "amber" | "blue" | "green" | "neutral";
}

export interface DataSource {
  id: string;
  name: AlertSource;
  status: "online" | "degraded" | "offline";
  lastUpdated: string;
  recordCount: string;
  endpoint: string;
}

export interface GeneData {
  gene: string;
  association: string;
  confidence: number;
}

export interface DrugData {
  name: string;
  status: "approved" | "trial" | "experimental";
  target: string;
}

export interface PaperData {
  title: string;
  authors: string[];
  journal: string;
  year: number;
  doi: string;
}

export type AlertSource = "WHO" | "CDC" | "FluView" | "ProMED" | "disease.sh" | "ECDC";

// ─── Filter State ────────────────────────────────────────────────────────────

export type TimeRange = "7d" | "30d" | "90d";
export type ScopeFilter = "global" | "regional";

export interface QueryState {
  query: string;
  timeRange: TimeRange;
  scope: ScopeFilter;
}

// ─── API Response Wrappers ───────────────────────────────────────────────────

export interface ApiResponse<T> {
  data: T;
  status: number;
  timestamp: string;
  source: string;
}

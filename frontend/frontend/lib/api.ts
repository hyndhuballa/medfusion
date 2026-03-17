/**
 * MedFusion API Client — Disease-Aware with Deterministic Profiles
 * Real backend data + disease-specific multipliers for dynamic dashboard
 */

import type {
  DiseaseStats,
  TrendDataPoint,
  RegionData,
  AlertItem,
  TimelineEvent,
  TimeRange,
} from "@/types";
import {
  MOCK_DISEASE_STATS,
  generateTrendData,
  MOCK_REGIONS,
  MOCK_ALERTS,
  MOCK_TIMELINE,
} from "./mockData";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

async function apiFetch<T>(path: string, fallback: T): Promise<T> {
  if (!API_BASE) return fallback;
  try {
    const res = await fetch(`${API_BASE}${path}`, { cache: "no-store" });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return (await res.json()) as T;
  } catch (err) {
    console.warn(`[MedFusion] Failed ${path}:`, err);
    return fallback;
  }
}

// ─── Deterministic hash ───────────────────────────────────────────────────────

function hashString(str: string): number {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    hash = (Math.imul(31, hash) + str.charCodeAt(i)) | 0;
  }
  return Math.abs(hash) / 2147483647;
}

// ─── Disease profiles ─────────────────────────────────────────────────────────

interface DiseaseProfile {
  ratio: number;       // multiplier against global COVID baseline
  activeRatio: number; // % of total that are active
  cfr: number;         // case fatality rate (0–1)
  growthBase: number;  // base growth % per 7d
  trend: "flat" | "rising" | "declining" | "exponential";
}

const DISEASE_PROFILES: Record<string, DiseaseProfile> = {
  "covid-19":      { ratio: 1.0,     activeRatio: 0.03, cfr: 0.010, growthBase: 0,   trend: "flat" },
  "covid":         { ratio: 1.0,     activeRatio: 0.03, cfr: 0.010, growthBase: 0,   trend: "flat" },
  "dengue":        { ratio: 0.06,    activeRatio: 0.10, cfr: 0.005, growthBase: 5,   trend: "rising" },
  "influenza":     { ratio: 0.40,    activeRatio: 0.08, cfr: 0.001, growthBase: 2,   trend: "flat" },
  "flu":           { ratio: 0.40,    activeRatio: 0.08, cfr: 0.001, growthBase: 2,   trend: "flat" },
  "ebola":         { ratio: 0.0001,  activeRatio: 0.20, cfr: 0.500, growthBase: 10,  trend: "exponential" },
  "mpox":          { ratio: 0.001,   activeRatio: 0.15, cfr: 0.030, growthBase: 4,   trend: "rising" },
  "monkeypox":     { ratio: 0.001,   activeRatio: 0.15, cfr: 0.030, growthBase: 4,   trend: "rising" },
  "cholera":       { ratio: 0.010,   activeRatio: 0.12, cfr: 0.020, growthBase: -2,  trend: "declining" },
  "tuberculosis":  { ratio: 0.015,   activeRatio: 0.20, cfr: 0.100, growthBase: -1,  trend: "flat" },
  "tb":            { ratio: 0.015,   activeRatio: 0.20, cfr: 0.100, growthBase: -1,  trend: "flat" },
  "malaria":       { ratio: 0.30,    activeRatio: 0.10, cfr: 0.003, growthBase: 1,   trend: "flat" },
  "h5n1":          { ratio: 0.00001, activeRatio: 0.30, cfr: 0.520, growthBase: 12,  trend: "exponential" },
  "avian flu":     { ratio: 0.00001, activeRatio: 0.30, cfr: 0.520, growthBase: 12,  trend: "exponential" },
  "sars":          { ratio: 0.00002, activeRatio: 0.01, cfr: 0.100, growthBase: -5,  trend: "declining" },
  "measles":       { ratio: 0.020,   activeRatio: 0.05, cfr: 0.015, growthBase: 8,   trend: "rising" },
  "typhoid":       { ratio: 0.030,   activeRatio: 0.08, cfr: 0.010, growthBase: 0,   trend: "flat" },
  "fever":         { ratio: 0.50,    activeRatio: 0.10, cfr: 0.001, growthBase: 0,   trend: "flat" },
  "zika":          { ratio: 0.005,   activeRatio: 0.12, cfr: 0.001, growthBase: 3,   trend: "rising" },
  "hiv":           { ratio: 0.05,    activeRatio: 0.90, cfr: 0.020, growthBase: -1,  trend: "flat" },
  "hepatitis":     { ratio: 0.08,    activeRatio: 0.30, cfr: 0.015, growthBase: 0,   trend: "flat" },
  "plague":        { ratio: 0.00005, activeRatio: 0.25, cfr: 0.300, growthBase: 8,   trend: "exponential" },
  "anthrax":       { ratio: 0.00001, activeRatio: 0.40, cfr: 0.200, growthBase: 6,   trend: "exponential" },
};

function getDiseaseProfile(query: string): DiseaseProfile {
  const key = query.toLowerCase().trim();
  if (DISEASE_PROFILES[key]) return DISEASE_PROFILES[key];

  // Deterministic fallback for unknown diseases
  const h = hashString(key);
  return {
    ratio:       0.0001 + h * 0.1,
    activeRatio: 0.01   + h * 0.2,
    cfr:         0.001  + h * 0.1,
    growthBase:  -5     + h * 20,
    trend: h > 0.75 ? "exponential" : h > 0.5 ? "rising" : h > 0.25 ? "flat" : "declining",
  };
}

// ─── Country routing ──────────────────────────────────────────────────────────

const KNOWN_COUNTRIES = new Set([
  "usa","us","uk","india","china","brazil","russia","france","germany","japan",
  "italy","spain","canada","australia","mexico","indonesia","netherlands","turkey",
  "saudi arabia","switzerland","argentina","sweden","poland","belgium","thailand",
  "iran","austria","israel","uae","nigeria","south africa","egypt","pakistan",
  "bangladesh","vietnam","philippines","malaysia","singapore","new zealand",
]);

function looksLikeCountry(q: string): boolean {
  return KNOWN_COUNTRIES.has(q.toLowerCase().trim());
}

// ─── fetchDiseaseStats ────────────────────────────────────────────────────────

export async function fetchDiseaseStats(disease: string): Promise<DiseaseStats> {
  // Country search → real per-country data
  if (looksLikeCountry(disease)) {
    const search = await apiFetch<Record<string, unknown>>(
      `/api/search?q=${encodeURIComponent(disease)}&type=country`, null
    );
    if (search && search.result) {
      const r = search.result as Record<string, number>;
      const cfr = r.cases && r.deaths ? Number(((r.deaths / r.cases) * 100).toFixed(2)) : 0;
      const active = r.active ?? 0;
      const perMillion = (active / (r.population ?? 1)) * 1_000_000;
      const rl = perMillion > 5000 ? "CRITICAL" : perMillion > 1000 ? "HIGH" : perMillion > 100 ? "MEDIUM" : "LOW";
      return {
        name: disease,
        totalCases: r.cases ?? 0,
        activeCases: active,
        growthRate: Number(r.today_cases ?? 0),
        alertCount: 0,
        riskLevel: rl as DiseaseStats["riskLevel"],
        cfr,
        lastUpdated: new Date().toISOString(),
      };
    }
  }

  // Disease query → real base data + disease profile multiplier
  const overview = await apiFetch<Record<string, unknown>>("/api/overview", null);
  const baseCases = overview
    ? ((overview.global as Record<string, number>)?.cases ?? 704753890)
    : 704753890;

  const profile = getDiseaseProfile(disease);
  const h = hashString(disease + "growth");

  const totalCases  = Math.floor(baseCases * profile.ratio);
  const activeCases = Math.floor(totalCases * profile.activeRatio);
  const deaths      = Math.floor(totalCases * profile.cfr);
  const growthRate  = parseFloat((profile.growthBase + (h * 4 - 2)).toFixed(2));
  const cfr         = parseFloat((profile.cfr * 100).toFixed(2));

  let riskLevel: DiseaseStats["riskLevel"] = "LOW";
  if (profile.cfr > 0.2  || growthRate > 10) riskLevel = "CRITICAL";
  else if (profile.cfr > 0.05 || growthRate > 5) riskLevel = "HIGH";
  else if (profile.cfr > 0.01 || growthRate > 2) riskLevel = "MEDIUM";

  // Count high alerts from ProMED
  const alerts = await apiFetch<Record<string, unknown>>("/api/alerts", null);
  const alertCount = alerts
    ? ((alerts.summary as Record<string, number>)?.high_severity ?? 0)
    : 0;

  return {
    name: disease,
    totalCases,
    activeCases,
    growthRate,
    alertCount,
    riskLevel,
    cfr,
    lastUpdated: new Date().toISOString(),
  };
}

// ─── fetchTrendData ───────────────────────────────────────────────────────────

export async function fetchTrendData(disease: string, timeRange: TimeRange): Promise<TrendDataPoint[]> {
  const days = timeRange === "7d" ? 7 : timeRange === "30d" ? 30 : 90;
  const raw = await apiFetch<Record<string, unknown>>(`/api/trends?days=${days}`, null);

  const profile = getDiseaseProfile(disease);
  const h = hashString(disease + "curve");

  // Use real timeline dates if available, else generate
  const baseCases = 704753890;
  const timeline = raw
    ? ((raw.timeline ?? []) as Array<Record<string, unknown>>)
    : Array.from({ length: days }, (_, i) => ({
        date: new Date(Date.now() - (days - i) * 86400000).toLocaleDateString("en-US", { month: "numeric", day: "numeric", year: "2-digit" }),
        cases: baseCases,
        deaths: 7010681,
        recovered: 0,
      }));

  return timeline.map((pt, index) => {
    const progress = index / Math.max(days - 1, 1);
    let curve = 1;

    switch (profile.trend) {
      case "exponential":
        curve = Math.pow(1.08 + h * 0.04, index);
        break;
      case "rising":
        curve = 1 + progress * 2;
        break;
      case "declining":
        curve = Math.max(0.05, 1 - progress * 0.8);
        break;
      default: // flat
        curve = 1 + Math.sin(index + h * 10) * 0.1;
    }

    const base = Number(pt.cases ?? baseCases);
    const confirmed = Math.max(0, Math.floor(base * profile.ratio * curve));

    return {
      date: String(pt.date ?? ""),
      confirmed,
      suspected: Math.floor(confirmed * 1.15),
      recovered: Math.max(0, Math.floor(confirmed * (1 - profile.activeRatio - profile.cfr))),
      deaths: Math.max(0, Math.floor(confirmed * profile.cfr)),
    };
  });
}

// ─── fetchRegionalData ────────────────────────────────────────────────────────

export async function fetchRegionalData(disease: string): Promise<RegionData[]> {
  const profile = getDiseaseProfile(disease);
  const raw = await apiFetch<Record<string, unknown>>("/api/spread", null);

  if (raw) {
    const usStates = (raw.us_states ?? {}) as Record<string, unknown>;
    const topStates = (usStates.top_by_new_cases ?? []) as Array<Record<string, unknown>>;
    if (topStates.length) {
      return topStates.slice(0, 10).map((s, i) => ({
        name: String(s.state ?? "Unknown"),
        country: "US",
        activeCases: Math.floor(Number(s.new_cases ?? 0) * profile.ratio * 10),
        totalCases: Math.floor(Number(s.total_cases ?? 0) * profile.ratio),
        growthPct: parseFloat((profile.growthBase + hashString(String(s.state) + disease) * 4 - 2).toFixed(1)),
        rank: i + 1,
      }));
    }
  }

  // Fallback: scale mock regions by disease profile
  return MOCK_REGIONS.map((r) => ({
    ...r,
    activeCases: Math.floor(r.activeCases * profile.ratio * 15),
    totalCases: Math.floor(r.totalCases * profile.ratio * 15),
    growthPct: parseFloat((profile.growthBase + hashString(r.name + disease) * 4 - 2).toFixed(1)),
  }));
}

// ─── fetchAlerts ──────────────────────────────────────────────────────────────

export async function fetchAlerts(disease: string): Promise<AlertItem[]> {
  const raw = await apiFetch<Record<string, unknown>>("/api/alerts", null);
  if (!raw) return MOCK_ALERTS;

  const alerts = (raw.alerts ?? []) as Array<Record<string, unknown>>;
  if (!alerts.length) return MOCK_ALERTS;

  const sevMap: Record<string, AlertItem["severity"]> = { high: "high", medium: "medium", low: "low" };
  const tagMap: Record<string, AlertItem["tag"]> = { high: "warning", medium: "info", low: "info" };

  return alerts.slice(0, 10).map((a, i) => {
    const sev = String(a.severity ?? "low");
    return {
      id: `alert-${i}`,
      severity: sevMap[sev] ?? "low",
      title: String(a.title ?? "Outbreak alert"),
      source: "ProMED" as AlertItem["source"],
      timestamp: String(a.published_at ?? "").slice(0, 16).replace("T", " ") || "recently",
      tag: tagMap[sev] ?? "info",
      region: undefined,
      disease: String(a.disease ?? disease) || disease,
    };
  });
}

// ─── fetchTimeline ────────────────────────────────────────────────────────────

export async function fetchTimeline(_disease: string): Promise<TimelineEvent[]> {
  return MOCK_TIMELINE;
}

// ─── Stubs ────────────────────────────────────────────────────────────────────

export async function fetchGenes(_disease: string)  { return []; }
export async function fetchDrugs(_disease: string)  { return []; }
export async function fetchPapers(_disease: string) { return []; }

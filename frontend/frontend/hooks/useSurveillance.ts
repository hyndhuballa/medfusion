"use client";

import { useState, useEffect, useCallback } from "react";
import type {
  DiseaseStats,
  TrendDataPoint,
  RegionData,
  AlertItem,
  TimelineEvent,
  QueryState,
} from "@/types";
import {
  fetchDiseaseStats,
  fetchTrendData,
  fetchRegionalData,
  fetchAlerts,
  fetchTimeline,
} from "@/lib/api";
import { MOCK_SOURCES } from "@/lib/mockData";

interface SurveillanceData {
  stats: DiseaseStats | null;
  trend: TrendDataPoint[];
  regions: RegionData[];
  alerts: AlertItem[];
  timeline: TimelineEvent[];
  sources: typeof MOCK_SOURCES;
  loading: boolean;
  error: string | null;
  lastFetched: Date | null;
}

const DEFAULT_QUERY: QueryState = {
  query: "Dengue",
  timeRange: "30d",
  scope: "global",
};

export function useSurveillance() {
  const [queryState, setQueryState] = useState<QueryState>(DEFAULT_QUERY);
  const [data, setData] = useState<SurveillanceData>({
    stats: null,
    trend: [],
    regions: [],
    alerts: [],
    timeline: [],
    sources: MOCK_SOURCES,
    loading: true,
    error: null,
    lastFetched: null,
  });

  const fetchAll = useCallback(async (q: QueryState) => {
    setData((prev) => ({ ...prev, loading: true, error: null }));
    try {
      const [stats, trend, regions, alerts, timeline] = await Promise.all([
        fetchDiseaseStats(q.query),
        fetchTrendData(q.query, q.timeRange),
        fetchRegionalData(q.query),
        fetchAlerts(q.query),
        fetchTimeline(q.query),
      ]);
      setData({
        stats,
        trend,
        regions,
        alerts,
        timeline,
        sources: MOCK_SOURCES,
        loading: false,
        error: null,
        lastFetched: new Date(),
      });
    } catch (err) {
      setData((prev) => ({
        ...prev,
        loading: false,
        error: err instanceof Error ? err.message : "Unknown error",
      }));
    }
  }, []);

  useEffect(() => {
    fetchAll(queryState);
  }, [fetchAll, queryState]);

  // Auto-refresh every 5 minutes
  useEffect(() => {
    const interval = setInterval(() => {
      fetchAll(queryState);
    }, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, [fetchAll, queryState]);

  const updateQuery = useCallback(
    (patch: Partial<QueryState>) => {
      setQueryState((prev) => ({ ...prev, ...patch }));
    },
    []
  );

  const runQuery = useCallback(
    (disease: string) => {
      const next = { ...queryState, query: disease };
      setQueryState(next);
    },
    [queryState]
  );

  return { queryState, data, updateQuery, runQuery };
}

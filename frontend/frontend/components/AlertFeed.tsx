"use client";

import { useEffect, useState } from "react";
import type { AlertItem } from "@/types";
import { getSeverityBarClass } from "@/lib/utils";

interface AlertFeedProps {
  alerts: AlertItem[];
  loading?: boolean;
}

const TAG_STYLES: Record<string, { bg: string; color: string }> = {
  critical: { bg: "rgba(224,60,60,0.08)", color: "#e05555" },
  warning: { bg: "rgba(212,131,58,0.08)", color: "#d4a23a" },
  info: { bg: "rgba(42,95,165,0.08)", color: "#4a8fd4" },
};

export default function AlertFeed({ alerts: initialAlerts, loading }: AlertFeedProps) {
  const [alerts, setAlerts] = useState<AlertItem[]>(initialAlerts);

  // Sync when prop changes (e.g. new query)
  useEffect(() => {
    setAlerts(initialAlerts);
  }, [initialAlerts]);

  // Simulate live alert ingestion
  useEffect(() => {
    const sources = ["WHO", "CDC", "ProMED"] as const;
    const interval = setInterval(() => {
      const newAlert: AlertItem = {
        id: `auto-${Date.now()}`,
        severity: "medium",
        title: `Automated signal: Anomalous case velocity detected in cluster ${Math.floor(Math.random() * 99) + 1}`,
        source: sources[Math.floor(Math.random() * sources.length)],
        timestamp: "just now",
        tag: "info",
      };
      setAlerts((prev) => [newAlert, ...prev].slice(0, 12));
    }, 18000);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="flex flex-col gap-px">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="h-16 bg-surface animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="flex flex-col divide-y divide-border overflow-y-auto max-h-[340px] scrollbar-thin">
      {alerts.map((alert) => {
        const tagStyle = TAG_STYLES[alert.tag] ?? TAG_STYLES.info;

        return (
          <div
            key={alert.id}
            className="flex gap-2.5 px-3.5 py-2.5 hover:bg-hover transition-colors cursor-pointer items-start"
          >
            {/* Severity bar */}
            <div
              className={`w-0.5 min-h-8 rounded-[1px] flex-shrink-0 mt-0.5 ${getSeverityBarClass(alert.severity)}`}
            />

            <div className="flex-1 min-w-0">
              <p className="text-[11px] text-text-primary leading-snug mb-1">
                {alert.title}
              </p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="font-mono text-[9px] text-signal-blue">{alert.source}</span>
                <span className="font-mono text-[9px] text-text-muted">{alert.timestamp}</span>
                <span
                  className="font-mono text-[9px] px-1.5 py-px rounded-[1px] tracking-wider uppercase"
                  style={{ background: tagStyle.bg, color: tagStyle.color }}
                >
                  {alert.tag}
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

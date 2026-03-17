import type { DiseaseStats } from "@/types";
import { formatNumber, formatDelta } from "@/lib/utils";

interface KpiStripProps {
  stats: DiseaseStats | null;
  loading?: boolean;
}

interface KpiCardProps {
  label: string;
  value: string;
  delta?: string;
  deltaDirection?: "up" | "down" | "neutral";
  subtext?: string;
  accentColor: "red" | "amber" | "green" | "blue" | "neutral";
  children?: React.ReactNode;
}

function KpiCard({ label, value, delta, deltaDirection = "neutral", subtext, accentColor, children }: KpiCardProps) {
  const accentMap = {
    red: "bg-accent-red",
    amber: "bg-accent-amber",
    green: "bg-accent-green",
    blue: "bg-accent-blue",
    neutral: "bg-border-mid",
  };

  const deltaColorMap = {
    up: "text-signal-red",
    down: "text-signal-green",
    neutral: "text-signal-amber",
  };

  return (
    <div className="bg-panel border border-border rounded-[3px] p-3 flex flex-col gap-1 relative overflow-hidden">
      {/* Top accent bar */}
      <div className={`absolute top-0 left-0 right-0 h-0.5 ${accentMap[accentColor]}`} />

      <div className="font-mono text-[9px] tracking-[0.10em] uppercase text-text-muted">{label}</div>

      <div className="font-mono text-[22px] font-semibold text-text-primary leading-none">
        {value}
      </div>

      {children}

      {(delta || subtext) && !children && (
        <div className="flex items-center gap-1.5 mt-0.5">
          {delta && (
            <span className={`font-mono text-[10px] font-medium flex items-center gap-0.5 ${deltaColorMap[deltaDirection]}`}>
              {deltaDirection === "up" ? "↑" : deltaDirection === "down" ? "↓" : "—"} {delta}
            </span>
          )}
          {subtext && <span className="text-[10px] text-text-muted">{subtext}</span>}
        </div>
      )}
    </div>
  );
}

function RiskBadge({ level }: { level: string }) {
  const map: Record<string, { bg: string; text: string; border: string }> = {
    HIGH: { bg: "bg-red-dim", text: "text-signal-red", border: "border-signal-red/20" },
    CRITICAL: { bg: "bg-red-dim", text: "text-signal-red", border: "border-signal-red/20" },
    MEDIUM: { bg: "bg-amber-dim", text: "text-signal-amber", border: "border-signal-amber/20" },
    LOW: { bg: "bg-green-dim", text: "text-signal-green", border: "border-signal-green/20" },
  };
  const c = map[level] ?? map.LOW;

  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[2px] font-mono text-[10px] font-medium tracking-[0.06em] uppercase border ${c.bg} ${c.text} ${c.border}`}
      style={{
        background: level === "HIGH" || level === "CRITICAL"
          ? "rgba(224,60,60,0.08)"
          : level === "MEDIUM"
          ? "rgba(212,131,58,0.08)"
          : "rgba(46,125,82,0.08)",
        borderColor: level === "HIGH" || level === "CRITICAL"
          ? "rgba(224,60,60,0.2)"
          : level === "MEDIUM"
          ? "rgba(212,131,58,0.2)"
          : "rgba(46,125,82,0.2)",
        color: level === "HIGH" || level === "CRITICAL"
          ? "#e05555"
          : level === "MEDIUM"
          ? "#d4a23a"
          : "#3aaa6b",
      }}
    >
      ● {level}
    </span>
  );
}

export default function KpiStrip({ stats, loading }: KpiStripProps) {
  const growthRate = stats?.growthRate ?? 0;
  const growthDir: "up" | "down" | "neutral" = growthRate > 0 ? "up" : growthRate < 0 ? "down" : "neutral";
  const growthStr = `${Math.abs(growthRate).toFixed(1)}%`;

  if (loading || !stats) {
    return (
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
        {Array.from({ length: 5 }).map((_, i) => (
          <div key={i} className="bg-panel border border-border rounded-[3px] p-3 h-[88px] animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2">
      <KpiCard label="Total Cases" value={formatNumber(stats.totalCases)} delta={growthStr} deltaDirection={growthDir} subtext="vs prior period" accentColor="red" />
      <KpiCard label="Active Cases" value={formatNumber(stats.activeCases)} delta={growthStr} deltaDirection={growthDir} subtext="currently infected" accentColor="amber" />
      <KpiCard label="Growth Rate" value={formatDelta(stats.growthRate)} delta={`${Math.abs(growthRate).toFixed(1)}pp`} deltaDirection={growthDir} subtext="7-day avg" accentColor="red" />
      <KpiCard label="Active Alerts" value={stats.alertCount.toString()} delta={stats.alertCount > 0 ? `${stats.alertCount} open` : "none"} deltaDirection={stats.alertCount > 3 ? "up" : "neutral"} subtext="from sources" accentColor="amber" />
      <KpiCard label="Risk Level" value="" accentColor={stats.riskLevel === "CRITICAL" || stats.riskLevel === "HIGH" ? "red" : stats.riskLevel === "MEDIUM" ? "amber" : "green"}>
        <div className="mt-1"><RiskBadge level={stats.riskLevel} /></div>
        <div className="text-[10px] text-text-muted mt-1">CFR: {stats.cfr.toFixed(2)}%</div>
      </KpiCard>
    </div>
  );
}

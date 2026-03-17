import type { DiseaseStats } from "@/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE_URL ?? "";

interface IntelligencePanelProps {
  stats: DiseaseStats | null;
}

interface IntelBlockProps {
  type: "danger" | "warning" | "info" | "stable";
  label: string;
  text: string;
}

function IntelBlock({ type, label, text }: IntelBlockProps) {
  const styles = {
    danger: {
      borderColor: "#e03c3c",
      bg: "rgba(224,60,60,0.05)",
      labelColor: "#e05555",
    },
    warning: {
      borderColor: "#d4833a",
      bg: "rgba(212,131,58,0.05)",
      labelColor: "#d4a23a",
    },
    info: {
      borderColor: "#2a5fa5",
      bg: "rgba(42,95,165,0.05)",
      labelColor: "#4a8fd4",
    },
    stable: {
      borderColor: "#2e7d52",
      bg: "rgba(46,125,82,0.05)",
      labelColor: "#3aaa6b",
    },
  };

  const s = styles[type];

  return (
    <div
      style={{
        background: s.bg,
        borderLeft: `2px solid ${s.borderColor}`,
        borderRadius: "2px",
        padding: "10px 12px",
      }}
    >
      <div
        className="font-mono text-[9px] tracking-[0.08em] uppercase font-semibold mb-1"
        style={{ color: s.labelColor }}
      >
        {label}
      </div>
      <div className="text-[12px] text-text-secondary leading-relaxed">{text}</div>
    </div>
  );
}

interface RiskMeterProps {
  label: string;
  value: number;
  color: string;
  textColor: string;
}

function RiskMeter({ label, value, color, textColor }: RiskMeterProps) {
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center">
        <span className="font-mono text-[9px] tracking-[0.06em] uppercase text-text-muted">
          {label}
        </span>
        <span className="font-mono text-[10px]" style={{ color: textColor }}>
          {value} / 100
        </span>
      </div>
      <div className="h-1 bg-elevated rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${value}%`, background: color }}
        />
      </div>
    </div>
  );
}

export default function IntelligencePanel({ stats }: IntelligencePanelProps) {
  const growthRate = stats?.growthRate ?? 0;
  const riskLevel = stats?.riskLevel ?? "LOW";
  const cfr = stats?.cfr ?? 0;
  const alertCount = stats?.alertCount ?? 0;
  const isRapid = growthRate > 5;
  const isRising = growthRate > 0;

  const transmissionRisk = riskLevel === "CRITICAL" ? 95 : riskLevel === "HIGH" ? 75 : riskLevel === "MEDIUM" ? 45 : 20;
  const dataConfidence = API_BASE ? 82 : 40;
  const responseCapacity = Math.max(10, 100 - transmissionRisk);

  return (
    <div className="flex flex-col gap-3 p-4">
      <IntelBlock
        type={isRapid ? "danger" : isRising ? "warning" : "stable"}
        label="Transmission Velocity"
        text={growthRate !== 0
          ? `Cases ${isRising ? "increasing" : "decreasing"} at ${Math.abs(growthRate).toFixed(1)}% over 7 days — ${isRapid ? "above" : isRising ? "near" : "below"} high-concern threshold.`
          : "Stable trend detected. No significant change in case velocity over the past 7 days."}
      />
      <IntelBlock
        type={riskLevel === "CRITICAL" || riskLevel === "HIGH" ? "danger" : riskLevel === "MEDIUM" ? "warning" : "stable"}
        label="Risk Assessment"
        text={`Risk level: ${riskLevel}. CFR at ${cfr.toFixed(2)}%. ${riskLevel === "CRITICAL" || riskLevel === "HIGH" ? "Immediate surveillance action recommended." : riskLevel === "MEDIUM" ? "Monitor closely for escalation." : "Standard protocols active."}`}
      />
      <IntelBlock
        type={alertCount > 0 ? "warning" : "info"}
        label="Alert Status"
        text={alertCount > 0
          ? `${alertCount} active alert(s) detected from integrated surveillance sources. Review ProMED feed for latest reports.`
          : "No high-severity alerts from integrated sources at this time. Routine surveillance active."}
      />
      <div className="flex flex-col gap-2 pt-2 border-t border-border">
        <RiskMeter label="Transmission Risk" value={transmissionRisk} color="#e03c3c" textColor="#e05555" />
        <RiskMeter label="Data Confidence" value={dataConfidence} color="#2a5fa5" textColor="#4a8fd4" />
        <RiskMeter label="Response Capacity" value={responseCapacity} color="#d4833a" textColor="#d4a23a" />
      </div>
    </div>
  );
}

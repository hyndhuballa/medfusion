"use client";

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceLine,
  type TooltipProps,
} from "recharts";
import type { TrendDataPoint } from "@/types";

interface TrendChartProps {
  data: TrendDataPoint[];
  loading?: boolean;
}

function CustomTooltip({ active, payload, label }: TooltipProps<number, string>) {
  if (!active || !payload?.length) return null;

  return (
    <div
      style={{
        background: "#141820",
        border: "1px solid #1e2635",
        borderRadius: "3px",
        padding: "10px 12px",
        fontFamily: "'IBM Plex Mono', monospace",
      }}
    >
      <div style={{ fontSize: "10px", color: "#7a8a9e", marginBottom: "6px" }}>{label}</div>
      {payload.map((entry) => (
        <div
          key={entry.name}
          style={{ fontSize: "11px", color: "#d4dbe8", display: "flex", gap: "8px", marginBottom: "2px" }}
        >
          <span style={{ color: entry.color }}>{entry.name}</span>
          <span>{(entry.value as number)?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
}

// Mark last 7 data points as anomaly zone by adding a reference area
function AnomalyLabel() {
  return (
    <div className="flex gap-4 mt-3">
      <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
        <span className="inline-block w-5 h-0.5 bg-accent-blue" />
        Confirmed
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
        <span
          className="inline-block w-5 h-0"
          style={{ borderTop: "1px dashed #d4833a" }}
        />
        Suspected
      </div>
      <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-muted">
        <span
          className="inline-block w-2 h-2"
          style={{
            background: "rgba(224,60,60,0.12)",
            border: "1px solid rgba(224,60,60,0.25)",
          }}
        />
        Anomaly zone
      </div>
    </div>
  );
}

export default function TrendChart({ data, loading }: TrendChartProps) {
  if (loading || !data.length) {
    return (
      <div className="h-[220px] bg-surface rounded-[3px] animate-pulse" />
    );
  }

  // Anomaly threshold: last 7 points
  const anomalyDate = data.length > 7 ? data[data.length - 7].date : data[0].date;

  const tickStyle = {
    fontFamily: "'IBM Plex Mono', monospace",
    fontSize: "9px",
    fill: "#4a5568",
  };

  return (
    <div>
      <ResponsiveContainer width="100%" height={220}>
        <AreaChart data={data} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
          <defs>
            <linearGradient id="confirmedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#2a5fa5" stopOpacity={0.12} />
              <stop offset="95%" stopColor="#2a5fa5" stopOpacity={0.01} />
            </linearGradient>
            <linearGradient id="suspectedGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="5%" stopColor="#d4833a" stopOpacity={0.07} />
              <stop offset="95%" stopColor="#d4833a" stopOpacity={0.01} />
            </linearGradient>
          </defs>

          <CartesianGrid
            strokeDasharray="0"
            stroke="#1e2635"
            strokeWidth={0.5}
            vertical={false}
          />

          <XAxis
            dataKey="date"
            tick={tickStyle}
            axisLine={{ stroke: "#1e2635" }}
            tickLine={false}
            interval="preserveStartEnd"
          />

          <YAxis
            tick={tickStyle}
            axisLine={false}
            tickLine={false}
            tickFormatter={(v: number) =>
              v >= 1000 ? `${(v / 1000).toFixed(0)}k` : `${v}`
            }
            width={36}
          />

          <Tooltip content={<CustomTooltip />} />

          {/* Anomaly zone reference line */}
          <ReferenceLine
            x={anomalyDate}
            stroke="rgba(224,60,60,0.3)"
            strokeDasharray="3 3"
            strokeWidth={1}
          />

          <Area
            type="monotone"
            dataKey="suspected"
            name="Suspected"
            stroke="#d4833a"
            strokeWidth={1}
            strokeDasharray="4 3"
            fill="url(#suspectedGrad)"
            dot={false}
            activeDot={{ r: 3, fill: "#d4833a", strokeWidth: 0 }}
          />

          <Area
            type="monotone"
            dataKey="confirmed"
            name="Confirmed"
            stroke="#2a5fa5"
            strokeWidth={1.5}
            fill="url(#confirmedGrad)"
            dot={false}
            activeDot={{ r: 3, fill: "#2a5fa5", strokeWidth: 0 }}
          />
        </AreaChart>
      </ResponsiveContainer>

      <AnomalyLabel />
    </div>
  );
}

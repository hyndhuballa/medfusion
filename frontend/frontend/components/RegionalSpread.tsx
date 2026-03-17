import type { RegionData } from "@/types";
import { formatNumber, formatDelta } from "@/lib/utils";

interface RegionalSpreadProps {
  regions: RegionData[];
  loading?: boolean;
}

export default function RegionalSpread({ regions, loading }: RegionalSpreadProps) {
  if (loading) {
    return (
      <div className="flex flex-col gap-2 p-4">
        {Array.from({ length: 8 }).map((_, i) => (
          <div key={i} className="h-8 bg-surface rounded animate-pulse" />
        ))}
      </div>
    );
  }

  const maxCases = regions[0]?.activeCases ?? 1;

  return (
    <div className="flex flex-col divide-y divide-border">
      {regions.map((region, i) => {
        const pct = Math.round((region.activeCases / maxCases) * 100);
        const isUp = region.growthPct > 0;
        const barColor =
          pct > 70
            ? "#e03c3c"
            : pct > 40
            ? "#d4833a"
            : "#2a5fa5";

        return (
          <div
            key={region.name}
            className="flex items-center gap-2.5 px-3.5 py-2 hover:bg-hover transition-colors cursor-pointer"
          >
            {/* Rank */}
            <span className="font-mono text-[10px] text-text-dim w-4 text-center flex-shrink-0">
              {i + 1}
            </span>

            {/* Name */}
            <span className="text-[12px] text-text-secondary flex-1 min-w-0 truncate">
              {region.name}
            </span>

            {/* Bar */}
            <div className="w-20 h-1 bg-elevated rounded-full overflow-hidden flex-shrink-0">
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{ width: `${pct}%`, background: barColor }}
              />
            </div>

            {/* Count */}
            <span className="font-mono text-[10px] text-text-secondary w-14 text-right flex-shrink-0 tabular-nums">
              {formatNumber(region.activeCases)}
            </span>

            {/* Trend */}
            <span
              className="font-mono text-[10px] w-12 text-right flex-shrink-0 tabular-nums"
              style={{ color: isUp ? "#e05555" : "#3aaa6b" }}
            >
              {formatDelta(region.growthPct)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

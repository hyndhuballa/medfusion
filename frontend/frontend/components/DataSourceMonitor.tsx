import type { DataSource } from "@/types";

interface DataSourceMonitorProps {
  sources: DataSource[];
}

const STATUS_STYLES = {
  online: {
    dot: "#3aaa6b",
    text: "#3aaa6b",
    label: "ONLINE",
  },
  degraded: {
    dot: "#d4a23a",
    text: "#d4a23a",
    label: "DEGRADED",
  },
  offline: {
    dot: "#e05555",
    text: "#e05555",
    label: "OFFLINE",
  },
};

export default function DataSourceMonitor({ sources }: DataSourceMonitorProps) {
  return (
    <div
      className="grid grid-cols-2 md:grid-cols-3 gap-px"
      style={{ background: "#1e2635" }}
    >
      {sources.map((source) => {
        const s = STATUS_STYLES[source.status];
        return (
          <div
            key={source.id}
            className="bg-panel px-3.5 py-2.5 flex flex-col gap-1"
          >
            <div className="flex items-center justify-between">
              <span className="font-mono text-[10px] font-semibold text-text-primary tracking-[0.04em]">
                {source.name}
              </span>
              <div className="flex items-center gap-1.5">
                <span
                  className="w-1.5 h-1.5 rounded-full flex-shrink-0"
                  style={{ background: s.dot }}
                />
                <span
                  className="font-mono text-[9px]"
                  style={{ color: s.text }}
                >
                  {s.label}
                </span>
              </div>
            </div>
            <div className="font-mono text-[9px] text-text-muted">
              Last sync: {source.lastUpdated}
            </div>
            <div className="font-mono text-[10px] text-text-secondary">
              {source.recordCount}
            </div>
          </div>
        );
      })}
    </div>
  );
}

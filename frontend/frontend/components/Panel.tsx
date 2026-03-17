import { cn } from "@/lib/utils";

interface PanelProps {
  children: React.ReactNode;
  className?: string;
}

interface PanelHeaderProps {
  title: string;
  accent?: "blue" | "red" | "amber" | "green" | "teal";
  badge?: React.ReactNode;
  meta?: string;
}

interface PanelBodyProps {
  children: React.ReactNode;
  className?: string;
  noPadding?: boolean;
}

const ACCENT_COLORS = {
  blue: "#2a5fa5",
  red: "#e03c3c",
  amber: "#d4833a",
  green: "#2e7d52",
  teal: "#1e6b6b",
};

export function Panel({ children, className }: PanelProps) {
  return (
    <div
      className={cn(
        "bg-panel border border-border rounded-[3px] flex flex-col",
        className
      )}
    >
      {children}
    </div>
  );
}

export function PanelHeader({ title, accent = "blue", badge, meta }: PanelHeaderProps) {
  return (
    <div className="flex items-center justify-between px-3.5 py-2 border-b border-border gap-2.5 flex-wrap">
      <div className="flex items-center gap-2">
        <div
          className="w-[3px] h-3 rounded-[1px] flex-shrink-0"
          style={{ background: ACCENT_COLORS[accent] }}
        />
        <span className="font-mono text-[10px] font-semibold tracking-[0.10em] uppercase text-text-secondary">
          {title}
        </span>
        {badge}
      </div>
      {meta && (
        <span className="font-mono text-[9px] text-text-muted tracking-[0.04em]">
          {meta}
        </span>
      )}
    </div>
  );
}

export function PanelBody({ children, className, noPadding }: PanelBodyProps) {
  return (
    <div className={cn(!noPadding && "p-3.5", "flex-1", className)}>
      {children}
    </div>
  );
}

export function LiveBadge() {
  return (
    <span
      className="font-mono text-[9px] px-1.5 py-px rounded-[2px] tracking-[0.04em]"
      style={{
        background: "rgba(46,125,82,0.15)",
        color: "#3aaa6b",
        border: "1px solid rgba(46,125,82,0.2)",
        animation: "blink 3s ease-in-out infinite",
      }}
    >
      ● LIVE
    </span>
  );
}

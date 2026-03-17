import type { TimelineEvent } from "@/types";

interface OutbreakTimelineProps {
  events: TimelineEvent[];
  loading?: boolean;
}

const DOT_COLORS: Record<TimelineEvent["severity"], string> = {
  red: "#e03c3c",
  amber: "#d4833a",
  blue: "#2a5fa5",
  green: "#2e7d52",
  neutral: "#1a1f28",
};

const DOT_BORDER_COLORS: Record<TimelineEvent["severity"], string> = {
  red: "#e03c3c",
  amber: "#d4833a",
  blue: "#2a5fa5",
  green: "#2e7d52",
  neutral: "#2e3a4a",
};

export default function OutbreakTimeline({ events, loading }: OutbreakTimelineProps) {
  if (loading) {
    return (
      <div className="p-4 flex flex-col gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="h-14 bg-surface rounded animate-pulse" />
        ))}
      </div>
    );
  }

  return (
    <div className="p-4">
      <div className="relative pl-5">
        {/* Track line */}
        <div
          className="absolute left-[6px] top-2 bottom-2 w-px"
          style={{ background: "#263040" }}
        />

        {events.map((event) => (
          <div key={event.id} className="relative flex gap-3 pb-5 last:pb-0">
            {/* Dot */}
            <div
              className="absolute -left-[14px] top-3 w-2 h-2 rounded-full flex-shrink-0 border"
              style={{
                background: DOT_COLORS[event.severity],
                borderColor: DOT_BORDER_COLORS[event.severity],
              }}
            />

            {/* Content */}
            <div className="flex-1 min-w-0 pl-2">
              <div className="font-mono text-[9px] text-text-muted tracking-[0.04em] mb-0.5">
                {event.date}
              </div>
              <div className="text-[11px] text-text-primary leading-snug mb-0.5">
                {event.event}
              </div>
              <div className="text-[10px] text-text-muted leading-snug">
                {event.description}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

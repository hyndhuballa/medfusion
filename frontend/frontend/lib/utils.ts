import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatNumber(n: number): string {
  if (n >= 1_000_000) return (n / 1_000_000).toFixed(1) + "M";
  if (n >= 1_000) return (n / 1_000).toFixed(1) + "K";
  return n.toString();
}

export function formatDelta(pct: number): string {
  const sign = pct > 0 ? "+" : "";
  return `${sign}${pct.toFixed(1)}%`;
}

export function getRiskColor(risk: string): string {
  switch (risk) {
    case "CRITICAL":
    case "HIGH":
      return "text-signal-red";
    case "MEDIUM":
      return "text-signal-amber";
    case "LOW":
      return "text-signal-green";
    default:
      return "text-text-secondary";
  }
}

export function getSeverityBarClass(severity: string): string {
  switch (severity) {
    case "critical":
      return "bg-accent-red";
    case "high":
      return "bg-accent-amber";
    case "medium":
      return "bg-accent-blue";
    case "low":
      return "bg-accent-teal";
    default:
      return "bg-border-mid";
  }
}

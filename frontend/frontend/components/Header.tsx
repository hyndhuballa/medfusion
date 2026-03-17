"use client";

import { useEffect, useState } from "react";

interface HeaderProps {
  activeSourceCount?: number;
}

export default function Header({ activeSourceCount = 6 }: HeaderProps) {
  const [timestamp, setTimestamp] = useState("");

  useEffect(() => {
    const update = () => {
      setTimestamp(new Date().toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    update();
    const interval = setInterval(update, 15000);
    return () => clearInterval(interval);
  }, []);

  return (
    <header className="sticky top-0 z-50 bg-base border-b border-border flex items-center justify-between px-5 h-[52px] gap-4">
      {/* Left: Brand */}
      <div className="flex items-center gap-3 flex-shrink-0">
        <div className="flex items-center gap-2">
          {/* Logo mark */}
          <svg width="24" height="24" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <rect x="2" y="2" width="9" height="9" rx="1" fill="#2a5fa5" opacity="0.9" />
            <rect x="13" y="2" width="9" height="9" rx="1" fill="#1e6b6b" opacity="0.7" />
            <rect x="2" y="13" width="9" height="9" rx="1" fill="#2e7d52" opacity="0.6" />
            <rect x="13" y="13" width="9" height="9" rx="1" fill="#e03c3c" opacity="0.8" />
          </svg>
          <div>
            <div className="font-mono text-[13px] font-semibold text-text-primary tracking-[0.08em] uppercase leading-none">
              MedFusion
            </div>
            <div className="font-mono text-[10px] text-text-secondary tracking-[0.06em] uppercase leading-none mt-0.5">
              Surveillance Hub
            </div>
          </div>
        </div>

        {/* Divider */}
        <div className="w-px h-7 bg-border-mid" />

        {/* Live status */}
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-1.5 font-mono text-[10px] text-text-secondary">
            <span className="w-1.5 h-1.5 rounded-full bg-signal-green animate-pulse" />
            LIVE
          </div>
          <div className="font-mono text-[10px] text-text-secondary">
            {activeSourceCount} SOURCES ACTIVE
          </div>
        </div>
      </div>

      {/* Right: Meta */}
      <div className="hidden sm:flex items-center gap-4 font-mono text-[10px] text-text-muted flex-shrink-0">
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-text-muted tracking-[0.06em] uppercase">Updated</span>
          <span className="text-[11px] text-text-secondary font-medium tabular-nums">{timestamp}</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-text-muted tracking-[0.06em] uppercase">Mode</span>
          <span className="text-[11px] text-text-secondary font-medium">GLOBAL</span>
        </div>
        <div className="flex flex-col items-end">
          <span className="text-[9px] text-text-muted tracking-[0.06em] uppercase">Interval</span>
          <span className="text-[11px] text-text-secondary font-medium">15 MIN</span>
        </div>
      </div>
    </header>
  );
}

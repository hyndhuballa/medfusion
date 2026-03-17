"use client";

import { useState } from "react";
import type { QueryState, TimeRange, ScopeFilter } from "@/types";

interface QueryLayerProps {
  queryState: QueryState;
  onQueryChange: (patch: Partial<QueryState>) => void;
  onRunQuery: (disease: string) => void;
}

export default function QueryLayer({ queryState, onQueryChange, onRunQuery }: QueryLayerProps) {
  const [inputValue, setInputValue] = useState(queryState.query);

  function handleRun() {
    if (inputValue.trim()) onRunQuery(inputValue.trim());
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Enter") handleRun();
  }

  const timeRanges: TimeRange[] = ["7d", "30d", "90d"];
  const scopes: ScopeFilter[] = ["global", "regional"];

  return (
    <div className="bg-panel border border-border rounded-[3px] px-4 py-3 flex items-center gap-3 flex-wrap">
      {/* Search */}
      <div className="flex-1 min-w-[200px] flex items-center gap-2 bg-surface border border-border-mid rounded-[3px] px-3 h-9 focus-within:border-border-hi transition-colors">
        <span className="text-text-muted text-xs flex-shrink-0">⌕</span>
        <input
          type="text"
          value={inputValue}
          onChange={(e) => setInputValue(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Query disease (e.g. Dengue, H5N1, Mpox) or region (e.g. India, West Africa) ..."
          className="flex-1 bg-transparent border-none outline-none text-text-primary font-mono text-[12px] tracking-wide placeholder:text-text-muted"
          aria-label="Disease or region search"
        />
      </div>

      {/* Time range */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-mono text-[10px] text-text-muted tracking-[0.06em] uppercase whitespace-nowrap">
          Range
        </span>
        <div className="flex gap-px bg-surface border border-border rounded-[3px] overflow-hidden">
          {timeRanges.map((t) => (
            <button
              key={t}
              onClick={() => onQueryChange({ timeRange: t })}
              className={`px-2.5 py-1 font-mono text-[10px] tracking-[0.04em] transition-all whitespace-nowrap
                ${queryState.timeRange === t
                  ? "bg-elevated text-text-primary"
                  : "text-text-muted hover:bg-hover hover:text-text-secondary"
                }`}
            >
              {t.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* Scope */}
      <div className="flex items-center gap-2 flex-shrink-0">
        <span className="font-mono text-[10px] text-text-muted tracking-[0.06em] uppercase whitespace-nowrap">
          Scope
        </span>
        <div className="flex gap-px bg-surface border border-border rounded-[3px] overflow-hidden">
          {scopes.map((s) => (
            <button
              key={s}
              onClick={() => onQueryChange({ scope: s })}
              className={`px-2.5 py-1 font-mono text-[10px] tracking-[0.04em] capitalize transition-all whitespace-nowrap
                ${queryState.scope === s
                  ? "bg-elevated text-text-primary"
                  : "text-text-muted hover:bg-hover hover:text-text-secondary"
                }`}
            >
              {s.charAt(0).toUpperCase() + s.slice(1)}
            </button>
          ))}
        </div>
      </div>

      {/* Run */}
      <button
        onClick={handleRun}
        className="px-4 h-9 bg-elevated border border-border-mid rounded-[3px] text-text-primary font-mono text-[11px] tracking-[0.04em] hover:border-border-hi hover:bg-hover transition-all whitespace-nowrap flex-shrink-0"
      >
        RUN QUERY ▶
      </button>
    </div>
  );
}

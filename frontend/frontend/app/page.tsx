"use client";

import Header from "@/components/Header";
import QueryLayer from "@/components/QueryLayer";
import KpiStrip from "@/components/KpiStrip";
import TrendChart from "@/components/TrendChart";
import IntelligencePanel from "@/components/IntelligencePanel";
import RegionalSpread from "@/components/RegionalSpread";
import AlertFeed from "@/components/AlertFeed";
import OutbreakTimeline from "@/components/OutbreakTimeline";
import DataSourceMonitor from "@/components/DataSourceMonitor";
import { Panel, PanelHeader, PanelBody, LiveBadge } from "@/components/Panel";
import { useSurveillance } from "@/hooks/useSurveillance";

export default function SurveillancePage() {
  const { queryState, data, updateQuery, runQuery } = useSurveillance();

  return (
    <div className="min-h-screen bg-base">
      {/* ── Fixed Header ── */}
      <Header
        activeSourceCount={
          data.sources.filter((s) => s.status === "online").length
        }
      />

      {/* ── Main Content ── */}
      <main className="px-5 py-3.5 flex flex-col gap-3 max-w-[1600px]">

        {/* ── 1. Query Layer ── */}
        <QueryLayer
          queryState={queryState}
          onQueryChange={updateQuery}
          onRunQuery={runQuery}
        />

        {/* ── 2. KPI Strip ── */}
        <KpiStrip stats={data.stats} loading={data.loading} />

        {/* ── 3. Core Visual Layer: Trend + Intelligence ── */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Trend chart — 2/3 width */}
          <div className="lg:col-span-2">
            <Panel>
              <PanelHeader
                title={`Case Progression — ${queryState.query} / ${queryState.scope === "global" ? "Global" : "Regional"} / ${queryState.timeRange.toUpperCase()}`}
                accent="blue"
                badge={<LiveBadge />}
                meta="Δ anomaly detection active"
              />
              <PanelBody>
                <TrendChart data={data.trend} loading={data.loading} />
              </PanelBody>
            </Panel>
          </div>

          {/* Intelligence panel — 1/3 width */}
          <div className="lg:col-span-1">
            <Panel>
              <PanelHeader
                title="Intelligence Assessment"
                accent="red"
                meta="AUTO-GEN"
              />
              <IntelligencePanel stats={data.stats} />
            </Panel>
          </div>
        </div>

        {/* ── 4. Secondary Analysis: Regional + Alerts ── */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-3">
          {/* Regional spread */}
          <Panel>
            <PanelHeader
              title="Regional Spread"
              accent="teal"
              meta="RANKED BY ACTIVE CASES"
            />
            <div className="overflow-y-auto max-h-[340px]">
              <RegionalSpread regions={data.regions} loading={data.loading} />
            </div>
          </Panel>

          {/* Alert feed */}
          <Panel>
            <PanelHeader
              title="Alert Feed"
              accent="amber"
              badge={
                <span
                  className="font-mono text-[9px] px-1.5 py-px rounded-[2px] tracking-[0.04em]"
                  style={{
                    background: "rgba(46,125,82,0.15)",
                    color: "#3aaa6b",
                    border: "1px solid rgba(46,125,82,0.2)",
                  }}
                >
                  ● STREAMING
                </span>
              }
            />
            <AlertFeed alerts={data.alerts} loading={data.loading} />
          </Panel>
        </div>

        {/* ── 5. Outbreak Timeline ── */}
        <Panel>
          <PanelHeader
            title="Outbreak Timeline — Key Events"
            accent="blue"
            meta={`CHRONOLOGICAL · ${queryState.query.toUpperCase()} 2024–2025`}
          />
          <OutbreakTimeline events={data.timeline} loading={data.loading} />
        </Panel>

        {/* ── 6. Data Source Monitor ── */}
        <Panel>
          <PanelHeader
            title="Data Source Monitor"
            accent="green"
            meta="6 INTEGRATED FEEDS"
          />
          <DataSourceMonitor sources={data.sources} />
        </Panel>

      </main>
    </div>
  );
}

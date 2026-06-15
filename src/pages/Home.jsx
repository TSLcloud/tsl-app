import { useState, useEffect } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardHeader } from "../components/ui/Card";
import { LoadingState } from "../components/ui/Spinner";
import { getKPIs, getProdEntries } from "../lib/api";
import { pctChange, trendDir, formatDateTime } from "../lib/utils";
import { SHEETS, KPI_METRICS } from "../lib/constants";

function KPICard({ metric, current, previous }) {
  const dir = trendDir(current, previous);
  const pct = pctChange(current, previous);
  return (
    <div className="bg-surface-1 border border-surface-3 rounded-lg p-4 flex flex-col gap-2">
      <p className="text-xs text-ink-muted uppercase tracking-wide font-medium">{metric.label}</p>
      <p className="text-3xl font-bold text-ink font-mono">{current ?? "—"}</p>
      <div className="flex items-center gap-2">
        <span className={`text-sm font-medium ${dir === "up" ? "text-green-400" : dir === "down" ? "text-red-400" : "text-ink-faint"}`}>
          {dir === "up" ? "▲" : dir === "down" ? "▼" : "—"} {pct ? `${Math.abs(pct)}%` : ""}
        </span>
        <span className="text-xs text-ink-faint">vs prev month ({previous ?? 0})</span>
      </div>
      <p className="text-[10px] text-ink-faint">{metric.dept}</p>
    </div>
  );
}

function ActivityFeed({ dept, entries }) {
  if (!entries?.length) return <p className="text-xs text-ink-faint">No recent activity.</p>;
  return (
    <div className="flex flex-col gap-1.5">
      {entries.slice(0, 5).map((e, i) => (
        <div key={i} className="flex items-center gap-3 text-xs">
          <span className="text-ink-faint font-mono w-20 shrink-0">{formatDateTime(e.date)}</span>
          <span className="text-ink">{e.product || e.sku || e.item || "—"}</span>
          <span className="text-ink-muted">×{e.count || e.quantity || 1}</span>
          {e.hairId && <span className="font-mono text-brand-300 text-[10px]">{e.hairId}</span>}
        </div>
      ))}
    </div>
  );
}

const DEPTS = [
  { key: "rexi",    label: "ReXI",            sheet: SHEETS.REXI_PROD },
  { key: "lab",     label: "Lab",             sheet: SHEETS.LAB_PROD },
  { key: "tailor",  label: "Tailor / MS",     sheet: SHEETS.TAILORMS_PROD },
  { key: "stylist", label: "Stylist",          sheet: SHEETS.STYLIST_PROD },
  { key: "final",   label: "Final Prod",       sheet: SHEETS.FINAL_PROD },
];

export default function Home() {
  const [kpis, setKpis]         = useState(null);
  const [activity, setActivity] = useState({});
  const [loading, setLoading]   = useState(true);

  useEffect(() => {
    async function load() {
      try {
        const [kpiRes, ...actRes] = await Promise.all([
          getKPIs(),
          ...DEPTS.map(d => getProdEntries(d.sheet, { limit: 5, sort: "desc" }))
        ]);
        setKpis(kpiRes.data || {});
        const act = {};
        DEPTS.forEach((d, i) => { act[d.key] = actRes[i]?.data || []; });
        setActivity(act);
      } catch (e) {
        // silent — offline or setup not done yet
      } finally {
        setLoading(false);
      }
    }
    load();
  }, []);

  return (
    <PageLayout title="TSL Dashboard" subtitle="Hair Production Overview">
      {loading ? <LoadingState /> : (
        <div className="flex flex-col gap-8">
          {/* KPI Table */}
          <Card>
            <CardHeader title="Key Performance Indicators" subtitle="Current vs Previous Month" />
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {KPI_METRICS.map(metric => (
                <KPICard
                  key={metric.label}
                  metric={metric}
                  current={kpis?.[metric.label]?.current ?? 0}
                  previous={kpis?.[metric.label]?.previous ?? 0}
                />
              ))}
            </div>
          </Card>

          {/* Activity Widgets */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {DEPTS.map(d => (
              <Card key={d.key}>
                <CardHeader title={d.label} subtitle="Recent activity" />
                <ActivityFeed dept={d.key} entries={activity[d.key]} />
              </Card>
            ))}
          </div>
        </div>
      )}
    </PageLayout>
  );
}

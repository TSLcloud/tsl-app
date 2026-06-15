import { useState, useCallback } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardHeader } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { Input, Select } from "../components/ui/Input";
import { Table, Th, Td, Tr } from "../components/ui/Table";
import { Badge } from "../components/ui/Badge";
import { LoadingState, EmptyState } from "../components/ui/Spinner";
import { toast } from "../components/ui/Toast";
import { getAnalytics, traceHairID } from "../lib/api";
import { exportCSV, formatDate, formatDateTime } from "../lib/utils";
import { SHEETS, MONTHS, TEAM_OPTIONS } from "../lib/constants";

const DEPT_OPTIONS = ["All","ReXI","Lab","Ventilation","Tailor/MS","Stylist","Final Prod"];
const STATUS_OPTIONS = ["All","In","Out","Submitted","Assigned","QA Pass","QA Fail"];

function HairIDTrace({ hairId, trace }) {
  if (!trace) return null;
  const DEPT_LABELS = {
    rexi: "ReXI", lab: "Lab", ventilation: "Ventilation",
    tailorms: "Tailor / MS", stylist: "Stylist", final: "Final Prod",
  };
  return (
    <div className="flex flex-col gap-2 mt-3">
      <p className="text-xs font-semibold text-ink-muted uppercase tracking-wide">
        Production Lineage — <span className="font-mono text-brand-300">{hairId}</span>
      </p>
      <div className="flex flex-col gap-1.5">
        {trace.map((step, i) => (
          <div key={i} className="flex items-center gap-3 bg-surface-2 rounded px-3 py-2 text-xs">
            <span className="w-5 h-5 rounded-full bg-brand-500/20 text-brand-300 flex items-center justify-center font-bold shrink-0">{i + 1}</span>
            <Badge variant="brand">{DEPT_LABELS[step.dept] || step.dept}</Badge>
            <span className="text-ink">{step.status || step.inOut}</span>
            <span className="text-ink-muted">{formatDateTime(step.date)}</span>
            {step.staff && <span className="text-ink-faint">by {step.staff}</span>}
          </div>
        ))}
      </div>
    </div>
  );
}

export default function Analytics() {
  const [filters, setFilters] = useState({
    dept: "All", dateFrom: "", dateTo: "", sku: "",
    staff: "", team: "All", status: "All", hairId: "",
  });
  const [results, setResults]   = useState(null);
  const [trace, setTrace]       = useState(null);
  const [loading, setLoading]   = useState(false);
  const [tracing, setTracing]   = useState(false);

  const setF = (k, v) => setFilters(f => ({ ...f, [k]: v }));

  const handleSearch = useCallback(async () => {
    setLoading(true); setResults(null); setTrace(null);
    try {
      const res = await getAnalytics(filters);
      setResults(res.data || []);
      if (!res.data?.length) toast("No results matched your filters.", "info");
    } catch { toast("Analytics query failed.", "error"); }
    finally { setLoading(false); }
  }, [filters]);

  const handleTrace = useCallback(async () => {
    if (!filters.hairId.trim()) { toast("Enter a Hair ID to trace.", "warning"); return; }
    setTracing(true); setTrace(null);
    try {
      const res = await traceHairID(filters.hairId.trim());
      setTrace(res.trace || []);
      if (!res.trace?.length) toast("No production history found for this Hair ID.", "info");
    } catch { toast("Trace failed.", "error"); }
    finally { setTracing(false); }
  }, [filters.hairId]);

  const handleExport = () => {
    if (!results?.length) { toast("No results to export.", "warning"); return; }
    exportCSV(results, `TSL_Analytics_${filters.dept}`);
    toast("CSV exported.", "success");
  };

  const COLS = [
    { key: "dept", label: "Dept" }, { key: "date", label: "Date" },
    { key: "hairId", label: "Hair ID" }, { key: "product", label: "Product" },
    { key: "count", label: "Count" }, { key: "status", label: "Status" },
    { key: "staff", label: "Staff" }, { key: "team", label: "Team" },
    { key: "why", label: "Why" },
  ];

  return (
    <PageLayout title="Analytics" subtitle="Open to all users — no password required">
      <div className="flex flex-col gap-6">
        {/* Filters */}
        <Card>
          <CardHeader title="Filters" />
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <Select label="Department" value={filters.dept} onChange={e => setF("dept", e.target.value)}>
              {DEPT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
            <Input label="Date From" type="date" value={filters.dateFrom} onChange={e => setF("dateFrom", e.target.value)} />
            <Input label="Date To"   type="date" value={filters.dateTo}   onChange={e => setF("dateTo",   e.target.value)} />
            <Input label="SKU / Product" value={filters.sku} onChange={e => setF("sku", e.target.value)} placeholder="Search…" />
            <Input label="Staff" value={filters.staff} onChange={e => setF("staff", e.target.value)} placeholder="Staff name…" />
            <Select label="Team" value={filters.team} onChange={e => setF("team", e.target.value)}>
              <option value="All">All</option>
              {TEAM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
            <Select label="Status" value={filters.status} onChange={e => setF("status", e.target.value)}>
              {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
            </Select>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">Hair ID Trace</label>
              <div className="flex gap-2">
                <input value={filters.hairId} onChange={e => setF("hairId", e.target.value)}
                  className="flex-1 bg-surface-2 border border-surface-4 rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/50"
                  placeholder="e.g. SPYC-BL/M-7231" />
                <Button size="sm" variant="outline" onClick={handleTrace} loading={tracing}>Trace</Button>
              </div>
            </div>
          </div>

          {trace && <HairIDTrace hairId={filters.hairId} trace={trace} />}

          <div className="flex justify-end gap-2 mt-4 pt-4 border-t border-surface-3">
            <Button variant="outline" onClick={handleExport} disabled={!results?.length}>Export CSV</Button>
            <Button onClick={handleSearch} loading={loading}>Search</Button>
          </div>
        </Card>

        {/* Results */}
        <Card padding={false}>
          <div className="p-5 border-b border-surface-3">
            <CardHeader
              title={results ? `${results.length} result${results.length !== 1 ? "s" : ""}` : "Results"}
              subtitle="Filtered across all departments"
            />
          </div>
          <div className="p-5">
            {loading ? <LoadingState /> :
             !results ? <EmptyState icon="🔍" title="Run a search" message="Use the filters above and click Search." /> :
             results.length === 0 ? <EmptyState icon="📭" title="No results" message="Try different filter values." /> : (
              <Table>
                <thead>
                  <tr>{COLS.map(c => <Th key={c.key}>{c.label}</Th>)}</tr>
                </thead>
                <tbody>
                  {results.map((row, i) => (
                    <Tr key={i}>
                      {COLS.map(c => (
                        <Td key={c.key}>
                          {c.key === "hairId" ? <span className="font-mono text-xs text-brand-300">{row[c.key] || "—"}</span>
                           : c.key === "date" ? formatDate(row[c.key])
                           : c.key === "status" ? <Badge variant="default">{row[c.key] || "—"}</Badge>
                           : row[c.key] ?? "—"}
                        </Td>
                      ))}
                    </Tr>
                  ))}
                </tbody>
              </Table>
            )}
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}

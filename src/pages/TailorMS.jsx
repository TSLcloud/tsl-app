import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardHeader } from "../components/ui/Card";
import { ProdTable } from "../components/modules/ProdTable";
import { InventoryTable } from "../components/modules/InventoryTable";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { toast } from "../components/ui/Toast";
import { SHEETS, WHY_OPTIONS, TEAM_OPTIONS, TAILORMS_STATUSES, INOUT_OPTIONS, MONTHS } from "../lib/constants";

// 1. API Imports (Database & Draft actions)
import { 
  writeProdEntry, 
  getProdEntries, 
  getInventory, 
  generateHairID, 
  saveDraft, 
  loadDraft, 
  clearDraft 
} from "../lib/api";

// 2. Utils Imports (Helper functions & Formatting)
import { 
  today, 
  currentMonth, 
  printHairIDLabel, 
  formatDate 
} from "../lib/utils";

const PROD_COLS = [
  { key: "date", label: "Date" }, { key: "month", label: "Month" },
  { key: "productName", label: "Product" }, { key: "count", label: "Count" },
  { key: "who", label: "Who" }, { key: "inOut", label: "In/Out" },
  { key: "hairId", label: "Hair ID" }, { key: "staff", label: "Staff" },
  { key: "type", label: "Type" }, { key: "why", label: "Why" },
  { key: "team", label: "Team" }, { key: "comment", label: "Comment" },
];
const TAILOR_INV_COLS = [
  { key: "product", label: "Product" },
  { key: "countAtStart", label: "@ Start", numeric: true },
  { key: "in", label: "In", numeric: true },
  { key: "out", label: "Out", numeric: true },
  { key: "balance", label: "Balance", numeric: true },
];
const MS_INV_COLS = [
  { key: "product", label: "Product" },
  { key: "countAtStart", label: "@ Start", numeric: true },
  { key: "submitted", label: "Submitted", numeric: true },
  { key: "out", label: "Out", numeric: true },
  { key: "balance", label: "Balance", numeric: true },
];

function TailorMSForm({ onSubmit, loading }) {
  const initData = () => ({
    date: today(), month: currentMonth(),
    productName: "", count: "", who: "", inOut: "",
    status: "", staff: "", comment: "", type: "", why: "", team: "",
  });

  const [data, setData] = useState(initData);
  const [generatingHairId, setGeneratingHairId] = useState(false);
  const [generatedHairId, setGeneratedHairId] = useState(null);

  useEffect(() => {
    const draft = loadDraft("tailorms_prod");
    if (draft) {
      if (window.confirm("Restore saved draft?")) setData(draft);
      else clearDraft("tailorms_prod");
    }
  }, []);

  useEffect(() => { saveDraft("tailorms_prod", data); }, [data]);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  const handleStatusChange = async (status) => {
    set("status", status);
    if (status === "Submitted" && data.productName && data.staff) {
      setGeneratingHairId(true);
      try {
        const res = await generateHairID(data.productName, data.staff);
        if (res.hairId) {
          setGeneratedHairId(res.hairId);
          set("hairId", res.hairId);
          // Auto-print label
          printHairIDLabel(res.hairId);
          toast(`Hair ID generated: ${res.hairId} — label printing…`, "success");
        }
      } catch {
        toast("Hair ID generation failed. Will retry on submit.", "warning");
      } finally {
        setGeneratingHairId(false);
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.productName || !data.count || !data.staff) {
      toast("Product name, count and staff are required.", "warning"); return;
    }
    if (data.status === "Submitted" && !data.hairId && !generatedHairId) {
      toast("Hair ID could not be generated. Check connection.", "error"); return;
    }
    await onSubmit({ ...data, hairId: generatedHairId || data.hairId });
    clearDraft("tailorms_prod");
    setData(initData());
    setGeneratedHairId(null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-4">
        <Input label="Date *" type="date" value={data.date} onChange={e => set("date", e.target.value)} />
        <Select label="Month *" value={data.month} onChange={e => set("month", e.target.value)}>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Input label="Product Name *" value={data.productName} onChange={e => set("productName", e.target.value)} />
        <Input label="Count *" type="number" min="0" value={data.count} onChange={e => set("count", e.target.value)} />
        <Select label="Who" value={data.who} onChange={e => set("who", e.target.value)}>
          {["Tailor","Machine Sewer"].map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
        <Select label="In / Out" value={data.inOut} onChange={e => set("inOut", e.target.value)}>
          {INOUT_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>

        {/* Status — triggers Hair ID generation */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">Status</label>
          <select value={data.status} onChange={e => handleStatusChange(e.target.value)}
            className="bg-surface-2 border border-surface-4 rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/50">
            <option value="">— Select —</option>
            {TAILORMS_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </select>
        </div>

        {/* Hair ID display */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">Hair ID</label>
          <div className="bg-surface-2 border border-surface-4 rounded px-3 py-2 flex items-center gap-2 min-h-[38px]">
            {generatingHairId ? (
              <span className="text-xs text-ink-muted animate-pulse">Generating…</span>
            ) : generatedHairId ? (
              <>
                <span className="font-mono text-sm text-brand-300">{generatedHairId}</span>
                <Badge variant="success" size="xs">Generated</Badge>
              </>
            ) : (
              <span className="text-xs text-ink-faint">Auto-generated on Submitted</span>
            )}
          </div>
        </div>

        <Input label="Staff *" value={data.staff} onChange={e => set("staff", e.target.value)} />
        <Select label="Type" value={data.type} onChange={e => set("type", e.target.value)}>
          {["Raw","Processed","Finished"].map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
        <Select label="Why" value={data.why} onChange={e => set("why", e.target.value)}>
          {WHY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
        <Select label="Team" value={data.team} onChange={e => set("team", e.target.value)}>
          {TEAM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
      </div>
      <Textarea label="Comment" value={data.comment} onChange={e => set("comment", e.target.value)} />
      <div className="flex justify-end">
        <Button type="submit" loading={loading || generatingHairId}>Submit Entry</Button>
      </div>
    </form>
  );
}

export function TailorMSProd() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try { const r = await getProdEntries(SHEETS.TAILORMS_PROD); setRows(r.data || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await writeProdEntry(SHEETS.TAILORMS_PROD, data);
      if (res.queued) toast("Entry queued — will sync when online.", "warning");
      else toast("Entry saved.", "success");
      load();
    } catch { toast("Failed to save entry.", "error"); }
    finally { setLoading(false); }
  };

  const handleReprint = (row) => {
    if (row.hairId) { printHairIDLabel(row.hairId); toast(`Reprinting label: ${row.hairId}`, "info"); }
  };

  return (
    <PageLayout title="Tailor / Machine Sewer — Production" subtitle="Hair ID auto-generated on Submitted status">
      {/* Hidden label print area */}
      <div id="label-print-area" style={{ display: "none" }} />
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="New Entry" subtitle="Setting status to Submitted generates a Hair ID and prints a label automatically" />
          <TailorMSForm onSubmit={handleSubmit} loading={loading} />
        </Card>
        <Card padding={false}>
          <div className="p-5 border-b border-surface-3">
            <CardHeader title="Production Log" action={<Button size="sm" variant="ghost" onClick={load}>↺ Refresh</Button>} />
          </div>
          <div className="p-5">
            <ProdTable columns={PROD_COLS} rows={rows} onReprint={handleReprint} />
          </div>
        </Card>
      </div>
    </PageLayout>
  );
}

export function TailorInventory() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      setLoading(true);
      try { const r = await getInventory(SHEETS.TAILOR_INVENTORY); setRows(r.data || []); } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);
  return (
    <PageLayout title="Tailor — Inventory" subtitle="Wig cap stock levels">
      <Card><CardHeader title="Tailor Inventory" />
        <InventoryTable columns={TAILOR_INV_COLS} rows={rows} loading={loading} />
      </Card>
    </PageLayout>
  );
}

export function MachineSewerInventory() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      setLoading(true);
      try { const r = await getInventory(SHEETS.MACHINESEWER_INVENTORY); setRows(r.data || []); } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);
  return (
    <PageLayout title="Machine Sewer — Inventory" subtitle="Finished hair product stock levels">
      <Card><CardHeader title="Machine Sewer Inventory" />
        <InventoryTable columns={MS_INV_COLS} rows={rows} loading={loading} />
      </Card>
    </PageLayout>
  );
}

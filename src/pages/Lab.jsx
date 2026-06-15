import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardHeader } from "../components/ui/Card";
import { ProdTable } from "../components/modules/ProdTable";
import { InventoryTable } from "../components/modules/InventoryTable";
import { Button } from "../components/ui/Button";
import { Select } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { toast } from "../components/ui/Toast";
import { getProdEntries, getInventory, writeProdEntry } from "../lib/api";
import { SHEETS, WHY_OPTIONS, TEAM_OPTIONS, MONTHS } from "../lib/constants";
import { currentMonth, formatDate } from "../lib/utils";

const LAB_DEST_OPTIONS = ["Machine Sewers","Ventilation"];

const PROD_COLS = [
  { key: "date", label: "Date" }, { key: "month", label: "Month" },
  { key: "processedItem", label: "Processed Item" }, { key: "quantity", label: "Qty" },
  { key: "status", label: "Status" }, { key: "destination", label: "Destination" },
  { key: "supervisor", label: "Supervisor" }, { key: "comment", label: "Comment" },
];
const INV_COLS = [
  { key: "labName",  label: "Lab Name" }, { key: "sourceSkU", label: "Source SKU" },
  { key: "countAtStart", label: "@ Start", numeric: true },
  { key: "in",  label: "In",  numeric: true }, { key: "out", label: "Out", numeric: true },
  { key: "balance", label: "Balance", numeric: true },
];

export function LabProd() {
  const [rexiOuts, setRexiOuts] = useState([]);
  const [rows, setRows]         = useState([]);
  const [loading, setLoading]   = useState(false);
  const [selected, setSelected] = useState("");
  const [dest, setDest]         = useState("");
  const [supervisor, setSupervisor] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [outs, lab] = await Promise.all([
        getProdEntries(SHEETS.REXI_PROD, { inOut: "Out", status: "pending_lab" }),
        getProdEntries(SHEETS.LAB_PROD),
      ]);
      setRexiOuts(outs.data || []);
      setRows(lab.data || []);
    } catch { toast("Failed to load Lab data.", "error"); }
    finally { setLoading(false); }
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!selected || !dest) { toast("Select a ReXI OUT entry and destination.", "warning"); return; }
    setSubmitting(true);
    try {
      const entry = rexiOuts.find(r => r._rowId === selected);
      await writeProdEntry(SHEETS.LAB_PROD, {
        date: new Date().toISOString().split("T")[0],
        month: currentMonth(),
        processedItem: entry?.sku || "",
        quantity: entry?.quantity || 0,
        status: "In",
        destination: dest,
        supervisor,
        sourceRexiRow: selected,
      });
      toast("Lab IN entry recorded.", "success");
      setSelected(""); setDest(""); setSupervisor("");
      load();
    } catch { toast("Failed to save.", "error"); }
    finally { setSubmitting(false); }
  };

  return (
    <PageLayout title="Lab — Production" subtitle="INs auto-populate from ReXI OUTs">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="New Lab IN — Select ReXI OUT Entry" />
          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            {loading ? <p className="text-xs text-ink-muted">Loading ReXI OUTs…</p> : rexiOuts.length === 0 ? (
              <p className="text-xs text-ink-muted bg-surface-2 rounded px-3 py-2">No pending ReXI OUT entries awaiting Lab receipt.</p>
            ) : (
              <div className="flex flex-col gap-2">
                {rexiOuts.map(r => (
                  <label key={r._rowId} className="flex items-center gap-3 px-3 py-2 bg-surface-2 rounded border border-surface-3 cursor-pointer hover:border-brand-500 transition-colors">
                    <input type="radio" name="rexiOut" value={r._rowId} checked={selected === r._rowId}
                      onChange={() => setSelected(r._rowId)} className="accent-brand-500" />
                    <span className="text-sm text-ink font-medium">{r.sku}</span>
                    <span className="text-sm text-ink-muted">×{r.quantity}</span>
                    <span className="text-xs text-ink-faint">{formatDate(r.date)}</span>
                  </label>
                ))}
              </div>
            )}
            <div className="grid grid-cols-2 gap-4">
              <Select label="Destination Team *" value={dest} onChange={e => setDest(e.target.value)}>
                {LAB_DEST_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
              </Select>
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">Supervisor Name</label>
                <input value={supervisor} onChange={e => setSupervisor(e.target.value)}
                  className="bg-surface-2 border border-surface-4 rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/50" />
              </div>
            </div>
            <div className="flex justify-end">
              <Button type="submit" loading={submitting}>Record Lab IN</Button>
            </div>
          </form>
        </Card>

        <Card padding={false}>
          <div className="p-5 border-b border-surface-3">
            <CardHeader title="Lab Production Log" action={<Button size="sm" variant="ghost" onClick={load}>↺ Refresh</Button>} />
          </div>
          <div className="p-5"><ProdTable columns={PROD_COLS} rows={rows} /></div>
        </Card>
      </div>
    </PageLayout>
  );
}

export function LabInventory() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      setLoading(true);
      try { const r = await getInventory(SHEETS.LAB_INVENTORY); setRows(r.data || []); } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);
  return (
    <PageLayout title="Lab — Inventory" subtitle="Processed item stock levels">
      <Card>
        <CardHeader title="Lab Inventory" />
        <InventoryTable columns={INV_COLS} rows={rows} loading={loading} />
      </Card>
    </PageLayout>
  );
}

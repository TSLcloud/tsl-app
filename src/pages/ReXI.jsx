import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardHeader } from "../components/ui/Card";
import { ProdForm } from "../components/modules/ProdForm";
import { ProdTable } from "../components/modules/ProdTable";
import { InventoryTable } from "../components/modules/InventoryTable";
import { Button } from "../components/ui/Button";
import { toast } from "../components/ui/Toast";
import { writeProdEntry, getProdEntries, getInventory } from "../lib/api";
import { SHEETS, WHY_OPTIONS, TEAM_OPTIONS, INOUT_OPTIONS, MONTHS } from "../lib/constants";
import { currentMonth } from "../lib/utils";

const REXI_FIELDS = [
  { name: "sku",      label: "SKU",      type: "text",   required: true, helper: "e.g. Rexi-Straight-Hair-18Inches-Merlot" },
  { name: "quantity", label: "Quantity", type: "number", required: true },
  { name: "inOut",    label: "In / Out", type: "select", required: true, options: INOUT_OPTIONS },
  { name: "why",      label: "Why",      type: "select", required: true, options: WHY_OPTIONS },
  { name: "team",     label: "Team",     type: "select", required: false, options: TEAM_OPTIONS },
  { name: "comment",  label: "Comment",  type: "textarea", required: false },
];

const PROD_COLS = [
  { key: "date", label: "Date" }, { key: "month", label: "Month" },
  { key: "sku",  label: "SKU"  }, { key: "quantity", label: "Qty" },
  { key: "inOut",label: "In/Out"}, { key: "why", label: "Why" },
  { key: "team", label: "Team" }, { key: "comment", label: "Comment" },
];

const INV_COLS = [
  { key: "sku",     label: "SKU" },
  { key: "countAtStart", label: "Count @ Start", numeric: true },
  { key: "in",      label: "In",      numeric: true },
  { key: "out",     label: "Out",     numeric: true },
  { key: "balance", label: "Balance", numeric: true },
];

export function RexiProd() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try { const r = await getProdEntries(SHEETS.REXI_PROD); setRows(r.data || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await writeProdEntry(SHEETS.REXI_PROD, data);
      if (res.queued) toast("Entry queued — will sync when online.", "warning");
      else toast("ReXI entry saved.", "success");
      load();
    } catch { toast("Failed to save entry.", "error"); }
    finally { setLoading(false); }
  };

  return (
    <PageLayout title="ReXI — Production" subtitle="Raw hair purchases & outgoing to Lab">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="New Entry" />
          <ProdForm module="rexi_prod" fields={REXI_FIELDS} onSubmit={handleSubmit} loading={loading}
            adminFields={[]} />
        </Card>
        <Card padding={false}>
          <div className="p-5 border-b border-surface-3">
            <CardHeader title="Production Log" action={<Button size="sm" variant="ghost" onClick={load}>↺ Refresh</Button>} />
          </div>
          <div className="p-5"><ProdTable columns={PROD_COLS} rows={rows} /></div>
        </Card>
      </div>
    </PageLayout>
  );
}

export function RexiInventory() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  const [period, setPeriod]   = useState(currentMonth());

  useEffect(() => {
    async function load() {
      setLoading(true);
      try { const r = await getInventory(SHEETS.REXI_INVENTORY); setRows(r.data || []); } catch {}
      finally { setLoading(false); }
    }
    load();
  }, [period]);

  return (
    <PageLayout title="ReXI — Inventory" subtitle="Live stock levels by SKU">
      <Card>
        <CardHeader title="Inventory" subtitle={`Period: ${period}`}
          action={
            <select value={period} onChange={e => setPeriod(e.target.value)}
              className="bg-surface-2 border border-surface-4 text-ink text-xs rounded px-2 py-1">
              {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
            </select>
          }
        />
        <InventoryTable columns={INV_COLS} rows={rows} loading={loading} period={period} />
      </Card>
    </PageLayout>
  );
}

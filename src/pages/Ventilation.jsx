import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardHeader } from "../components/ui/Card";
import { ProdForm } from "../components/modules/ProdForm";
import { ProdTable } from "../components/modules/ProdTable";
import { InventoryTable } from "../components/modules/InventoryTable";
import { Button } from "../components/ui/Button";
import { toast } from "../components/ui/Toast";
import { writeProdEntry, getProdEntries, getInventory } from "../lib/api";
import { SHEETS, WHY_OPTIONS, TEAM_OPTIONS, VENTILATION_STATUSES } from "../lib/constants";

const VENT_FIELDS = [
  { name: "item",   label: "Item",   type: "text",   required: true },
  { name: "count",  label: "Count",  type: "number", required: true },
  { name: "status", label: "Status", type: "select", required: true, options: VENTILATION_STATUSES },
  { name: "staff",  label: "Staff",  type: "text",   required: false },
  { name: "qa",     label: "QA",     type: "text",   required: false },
  { name: "type",   label: "Type",   type: "text",   required: false, readOnly: true, helper: "Auto-set by status" },
  { name: "why",    label: "Why",    type: "select", required: false, options: WHY_OPTIONS },
];

// Status → Type/Why mapping per spec
const STATUS_TYPE_MAP = {
  "In":        { type: "Raw",       why: "Ventilation" },
  "Assigned":  { type: "Processed", why: "Ventilation" },
  "Submitted": { type: "Processed", why: "Ventilation" },
  "Out":       { type: "Processed", why: "Sewing"       },
};

const PROD_COLS = [
  { key: "date", label: "Date" }, { key: "month", label: "Month" },
  { key: "item", label: "Item" }, { key: "count", label: "Count" },
  { key: "status", label: "Status" }, { key: "staff", label: "Staff" },
  { key: "qa", label: "QA" }, { key: "type", label: "Type" }, { key: "why", label: "Why" },
];

const INV_COLS = [
  { key: "sku",        label: "SKU" },
  { key: "texture",    label: "Texture" },
  { key: "countAtStart", label: "@ Start", numeric: true },
  { key: "in",         label: "In",       numeric: true },
  { key: "assigned",   label: "Assigned", numeric: true },
  { key: "submitted",  label: "Submitted",numeric: true },
  { key: "out",        label: "Out",      numeric: true },
  { key: "balance",    label: "Balance",  numeric: true },
];

export function VentilationProd() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try { const r = await getProdEntries(SHEETS.VENTILATION_PROD); setRows(r.data || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      // Auto-set Type based on Status
      const mapped = STATUS_TYPE_MAP[data.status] || {};
      const payload = { ...data, type: mapped.type || data.type, why: mapped.why || data.why };
      const res = await writeProdEntry(SHEETS.VENTILATION_PROD, payload);
      if (res.queued) toast("Entry queued — will sync when online.", "warning");
      else toast("Ventilation entry saved.", "success");
      load();
    } catch { toast("Failed to save entry.", "error"); }
    finally { setLoading(false); }
  };

  return (
    <PageLayout title="Ventilation — Production" subtitle="Status/Type/Why auto-mapped per entry">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="New Entry" subtitle="Type is auto-set from Status" />
          <ProdForm module="vent_prod" fields={VENT_FIELDS} onSubmit={handleSubmit} loading={loading}
            adminFields={[]} />
        </Card>
        <Card padding={false}>
          <div className="p-5 border-b border-surface-3">
            <CardHeader title="Ventilation Log" action={<Button size="sm" variant="ghost" onClick={load}>↺ Refresh</Button>} />
          </div>
          <div className="p-5"><ProdTable columns={PROD_COLS} rows={rows} /></div>
        </Card>
      </div>
    </PageLayout>
  );
}

export function VentilationInventory() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      setLoading(true);
      try { const r = await getInventory(SHEETS.VENTILATION_INVENTORY); setRows(r.data || []); } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);
  return (
    <PageLayout title="Ventilation — Inventory">
      <Card>
        <CardHeader title="Ventilation Inventory" />
        <InventoryTable columns={INV_COLS} rows={rows} loading={loading} />
      </Card>
    </PageLayout>
  );
}

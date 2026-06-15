import { useState, useEffect, useCallback } from "react";
import { PageLayout } from "../components/layout/PageLayout";
import { Card, CardHeader } from "../components/ui/Card";
import { ProdTable } from "../components/modules/ProdTable";
import { InventoryTable } from "../components/modules/InventoryTable";
import { Button } from "../components/ui/Button";
import { Input, Select, Textarea } from "../components/ui/Input";
import { Badge } from "../components/ui/Badge";
import { toast } from "../components/ui/Toast";
import { writeProdEntry, getProdEntries, getInventory, lookupHairID } from "../lib/api";
import { SHEETS, WHY_OPTIONS, TEAM_OPTIONS, FINAL_STATUSES, FINAL_ORDER_ID_EXCEPTIONS, MONTHS } from "../lib/constants";
import { today, currentMonth } from "../lib/utils";

const PROD_COLS = [
  { key: "hairId", label: "Hair ID" }, { key: "date", label: "Date" },
  { key: "month", label: "Month" }, { key: "products", label: "Products" },
  { key: "count", label: "Count" }, { key: "orderId", label: "Order ID" },
  { key: "inOut", label: "In/Out" }, { key: "staff", label: "Staff" },
  { key: "comment", label: "Comment" }, { key: "type", label: "Type" },
  { key: "why", label: "Why" }, { key: "team", label: "Team" },
];
const INV_COLS = [
  { key: "product", label: "Product" },
  { key: "countAtStart", label: "@ Start", numeric: true },
  { key: "in", label: "In", numeric: true },
  { key: "out", label: "Out", numeric: true },
  { key: "balance", label: "Balance", numeric: true },
];

function FinalProdForm({ onSubmit, loading }) {
  const init = () => ({
    hairId: "", date: today(), month: currentMonth(),
    products: "", count: "", orderId: "", inOut: "",
    staff: "", comment: "", type: "", why: "", team: "",
  });

  const [data, setData]       = useState(init);
  const [lookup, setLookup]   = useState(null);
  const [looking, setLooking] = useState(false);
  const [hairIdError, setHairIdError] = useState("");
  const [orderIdWarning, setOrderIdWarning] = useState("");
  const [rowFlagged, setRowFlagged] = useState(false);

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  // Hair ID lookup
  const handleHairIdBlur = async () => {
    if (!data.hairId.trim()) return;
    setLooking(true); setHairIdError("");
    try {
      const res = await lookupHairID(data.hairId.trim());
      if (!res.found) { setHairIdError("Hair ID not found."); setLookup(null); return; }
      // Must be Stylist OUT + QA Pass
      if (!res.record.stylistQAPassed) {
        setHairIdError("Hair ID has not passed Stylist QA. Cannot proceed to Final Prod.");
        setLookup(null); return;
      }
      setLookup(res.record);
      setData(d => ({ ...d, products: res.record.product || d.products }));
      toast("Hair ID verified — Stylist QA passed.", "success");
    } catch {
      setHairIdError("Lookup failed. Check connection.");
    } finally { setLooking(false); }
  };

  // Order ID validation — OUT requires Order ID unless exception applies
  const validateOrderId = (inOut, why, orderId) => {
    if (inOut !== "Out") { setOrderIdWarning(""); setRowFlagged(false); return; }
    const isException = FINAL_ORDER_ID_EXCEPTIONS.includes(why);
    if (!orderId && !isException) {
      setOrderIdWarning("Order ID required for OUT entries (unless Why = Restyling, Photo shoot, or Send to UK).");
      setRowFlagged(true);
    } else {
      setOrderIdWarning("");
      setRowFlagged(false);
    }
  };

  const handleWhyChange = (v) => { set("why", v); validateOrderId(data.inOut, v, data.orderId); };
  const handleInOutChange = (v) => { set("inOut", v); validateOrderId(v, data.why, data.orderId); };
  const handleOrderIdChange = (v) => { set("orderId", v); validateOrderId(data.inOut, data.why, v); };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.hairId) { toast("Hair ID is required.", "warning"); return; }
    if (hairIdError)  { toast("Fix Hair ID error before submitting.", "warning"); return; }
    if (!data.staff)  { toast("Staff name is required.", "warning"); return; }
    // Flag row if OUT without Order ID (non-exception)
    await onSubmit({ ...data, _flagged: rowFlagged });
    if (rowFlagged) toast("Row flagged red — Order ID missing for OUT entry.", "warning");
    setData(init()); setLookup(null); setRowFlagged(false); setOrderIdWarning("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {rowFlagged && (
        <div className="text-xs text-red-300 bg-red-900/20 border border-red-700/40 rounded px-3 py-2">
          ⚠ OUT entry missing Order ID. Row will be flagged red unless Why is an exception (Restyling / Photo shoot / Send to UK).
        </div>
      )}

      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input label="Hair ID *" value={data.hairId}
            onChange={e => { set("hairId", e.target.value); setHairIdError(""); setLookup(null); }}
            onBlur={handleHairIdBlur}
            error={hairIdError}
            helper="Must be Stylist OUT + QA Pass"
            placeholder="e.g. SPYC-BL/M-7231"
          />
        </div>
        {looking && <span className="text-xs text-ink-muted pb-2 animate-pulse">Verifying…</span>}
        {lookup && <Badge variant="success">QA ✓</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Date *" type="date" value={data.date} onChange={e => set("date", e.target.value)} />
        <Select label="Month *" value={data.month} onChange={e => set("month", e.target.value)}>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Input label="Products" value={data.products} onChange={e => set("products", e.target.value)}
          helper="Auto-populated from Hair ID" />
        <Input label="Count *" type="number" min="0" value={data.count} onChange={e => set("count", e.target.value)} />

        {/* Order ID — conditionally required */}
        <div className="flex flex-col gap-1">
          <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">
            Order ID {data.inOut === "Out" && !FINAL_ORDER_ID_EXCEPTIONS.includes(data.why) ? "*" : ""}
          </label>
          <input value={data.orderId} onChange={e => handleOrderIdChange(e.target.value)}
            className={`bg-surface-2 border rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/50 ${orderIdWarning ? "border-red-500" : "border-surface-4"}`}
            placeholder="Order ID"
          />
          {orderIdWarning && <p className="text-xs text-red-400">{orderIdWarning}</p>}
        </div>

        <Select label="In / Out *" value={data.inOut} onChange={e => handleInOutChange(e.target.value)}>
          {FINAL_STATUSES.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
        <Input label="Staff *" value={data.staff} onChange={e => set("staff", e.target.value)} />
        <Select label="Type" value={data.type} onChange={e => set("type", e.target.value)}>
          {["Dispatch","Return","Restyling"].map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
        <Select label="Why" value={data.why} onChange={e => handleWhyChange(e.target.value)}>
          {WHY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
        <Select label="Team" value={data.team} onChange={e => set("team", e.target.value)}>
          {TEAM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
      </div>
      <Textarea label="Comment" value={data.comment} onChange={e => set("comment", e.target.value)} />
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>Submit Entry</Button>
      </div>
    </form>
  );
}

export function FinalProdPage() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try { const r = await getProdEntries(SHEETS.FINAL_PROD); setRows(r.data || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await writeProdEntry(SHEETS.FINAL_PROD, data);
      if (res.queued) toast("Entry queued — will sync when online.", "warning");
      else toast("Final Prod entry saved.", "success");
      load();
    } catch { toast("Failed to save entry.", "error"); }
    finally { setLoading(false); }
  };

  return (
    <PageLayout title="Final Prod — Production" subtitle="OUT requires Hair ID + Order ID (exceptions: Restyling, Photo shoot, Send to UK)">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="New Entry" />
          <FinalProdForm onSubmit={handleSubmit} loading={loading} />
        </Card>
        <Card padding={false}>
          <div className="p-5 border-b border-surface-3">
            <CardHeader title="Final Prod Log" action={<Button size="sm" variant="ghost" onClick={load}>↺ Refresh</Button>} />
          </div>
          <div className="p-5"><ProdTable columns={PROD_COLS} rows={rows} /></div>
        </Card>
      </div>
    </PageLayout>
  );
}

export function FinalInventory() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      setLoading(true);
      try { const r = await getInventory(SHEETS.FINAL_INVENTORY); setRows(r.data || []); } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);
  return (
    <PageLayout title="Final Prod — Inventory">
      <Card><CardHeader title="Final Inventory" />
        <InventoryTable columns={INV_COLS} rows={rows} loading={loading} />
      </Card>
    </PageLayout>
  );
}

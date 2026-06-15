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
import { SHEETS, WHY_OPTIONS, TEAM_OPTIONS, STYLIST_STATUSES, MONTHS } from "../lib/constants";
import { today, currentMonth, formatDate } from "../lib/utils";

const PROD_COLS = [
  { key: "hairId", label: "Hair ID" }, { key: "date", label: "Date" },
  { key: "month", label: "Month" }, { key: "productName", label: "Product" },
  { key: "count", label: "Count" }, { key: "inOut", label: "In/Out" },
  { key: "who", label: "Who" }, { key: "staff", label: "Staff" },
  { key: "initStaff", label: "Init. Staff" },
  { key: "type", label: "Type" }, { key: "why", label: "Why" }, { key: "team", label: "Team" },
];
const INV_COLS = [
  { key: "productName", label: "Product" },
  { key: "countAtStart", label: "@ Start", numeric: true },
  { key: "in", label: "In", numeric: true },
  { key: "out", label: "Out", numeric: true },
  { key: "balance", label: "Balance", numeric: true },
];

function StylistForm({ onSubmit, loading }) {
  const init = () => ({
    hairId: "", date: today(), month: currentMonth(),
    productName: "", count: "", inOut: "", who: "",
    staff: "", initStaff: "", type: "", why: "", team: "",
  });

  const [data, setData]       = useState(init);
  const [lookup, setLookup]   = useState(null);
  const [looking, setLooking] = useState(false);
  const [hairIdError, setHairIdError] = useState("");

  const set = (k, v) => setData(d => ({ ...d, [k]: v }));

  // Hair ID lookup — auto-populate fields
  const handleHairIdBlur = async () => {
    if (!data.hairId.trim()) return;
    setLooking(true); setHairIdError("");
    try {
      const res = await lookupHairID(data.hairId.trim());
      if (!res.found) {
        setHairIdError("Hair ID not found."); setLookup(null); return;
      }
      if (res.record.currentStatus !== "Out" || res.record.lastDept !== "Stylist") {
        // Only allow if item was OUTed to Stylist
        if (!res.record.outToStylist) {
          setHairIdError("This Hair ID has not been OUT to Stylist."); setLookup(null); return;
        }
      }
      setLookup(res.record);
      setData(d => ({
        ...d,
        productName: res.record.product || d.productName,
        initStaff:   res.record.staff   || d.initStaff,
      }));
      toast("Hair ID found — fields populated.", "success");
    } catch {
      setHairIdError("Lookup failed. Check connection.");
    } finally { setLooking(false); }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!data.hairId) { toast("Hair ID is required.", "warning"); return; }
    if (!data.staff)  { toast("Staff name is required.", "warning"); return; }
    if (hairIdError)  { toast("Fix Hair ID error before submitting.", "warning"); return; }

    // QA Fail — auto-create new Submitted entry for same hair/staff
    if (data.inOut === "QA Fail") {
      await onSubmit({ ...data });
      // auto-create new Submitted entry
      await onSubmit({ ...data, inOut: "Submitted", date: today(), hairId: data.hairId });
      toast("QA Fail recorded. New Submitted entry auto-created.", "info");
      setData(init()); setLookup(null);
      return;
    }
    await onSubmit(data);
    setData(init()); setLookup(null);
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {/* Balance = 0 warning reminder */}
      <div className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded px-3 py-2">
        ⚠ Stylist balance must equal zero. Unfulfilled items flag at 12:00 next day.
      </div>

      {/* Hair ID field with lookup */}
      <div className="flex gap-2 items-end">
        <div className="flex-1">
          <Input label="Hair ID *" value={data.hairId}
            onChange={e => { set("hairId", e.target.value); setHairIdError(""); setLookup(null); }}
            onBlur={handleHairIdBlur}
            error={hairIdError}
            helper="Tab away to auto-populate fields"
            placeholder="e.g. SPYC-BL/M-7231"
          />
        </div>
        {looking && <span className="text-xs text-ink-muted pb-2 animate-pulse">Looking up…</span>}
        {lookup && <Badge variant="success">Found ✓</Badge>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <Input label="Date *" type="date" value={data.date} onChange={e => set("date", e.target.value)} />
        <Select label="Month *" value={data.month} onChange={e => set("month", e.target.value)}>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </Select>
        <Input label="Product Name" value={data.productName} onChange={e => set("productName", e.target.value)}
          helper="Auto-populated from Hair ID" />
        <Input label="Count *" type="number" min="0" value={data.count} onChange={e => set("count", e.target.value)} />
        <Select label="In / Out *" value={data.inOut} onChange={e => set("inOut", e.target.value)}>
          {STYLIST_STATUSES.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
        <Input label="Who" value={data.who} onChange={e => set("who", e.target.value)} />
        <Input label="Staff *" value={data.staff} onChange={e => set("staff", e.target.value)} />
        <Input label="Initial Assigned Staff" value={data.initStaff} onChange={e => set("initStaff", e.target.value)}
          helper="Auto-populated from Hair ID" />
        <Select label="Type" value={data.type} onChange={e => set("type", e.target.value)}>
          {["Styling","Restyling","QA"].map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
        <Select label="Why" value={data.why} onChange={e => set("why", e.target.value)}>
          {WHY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
        <Select label="Team" value={data.team} onChange={e => set("team", e.target.value)}>
          {TEAM_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
      </div>
      <div className="flex justify-end">
        <Button type="submit" loading={loading}>Submit Entry</Button>
      </div>
    </form>
  );
}

export function StylistProd() {
  const [rows, setRows]     = useState([]);
  const [loading, setLoading] = useState(false);

  const load = useCallback(async () => {
    try { const r = await getProdEntries(SHEETS.STYLIST_PROD); setRows(r.data || []); } catch {}
  }, []);

  useEffect(() => { load(); }, [load]);

  const handleSubmit = async (data) => {
    setLoading(true);
    try {
      const res = await writeProdEntry(SHEETS.STYLIST_PROD, data);
      if (res.queued) toast("Entry queued — will sync when online.", "warning");
      else toast("Stylist entry saved.", "success");
      load();
    } catch { toast("Failed to save entry.", "error"); }
    finally { setLoading(false); }
  };

  return (
    <PageLayout title="Stylist — Production" subtitle="Hair ID driven. QA Fail auto-creates new Submitted entry.">
      <div className="flex flex-col gap-6">
        <Card>
          <CardHeader title="New Entry" />
          <StylistForm onSubmit={handleSubmit} loading={loading} />
        </Card>
        <Card padding={false}>
          <div className="p-5 border-b border-surface-3">
            <CardHeader title="Stylist Log" action={<Button size="sm" variant="ghost" onClick={load}>↺ Refresh</Button>} />
          </div>
          <div className="p-5"><ProdTable columns={PROD_COLS} rows={rows} /></div>
        </Card>
      </div>
    </PageLayout>
  );
}

export function StylistInventory() {
  const [rows, setRows]       = useState([]);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    async function load() {
      setLoading(true);
      try { const r = await getInventory(SHEETS.STYLIST_INVENTORY); setRows(r.data || []); } catch {}
      finally { setLoading(false); }
    }
    load();
  }, []);
  return (
    <PageLayout title="Stylist — Inventory" subtitle="Balance must always equal zero">
      <Card>
        <CardHeader title="Stylist Inventory" />
        <InventoryTable columns={INV_COLS} rows={rows} loading={loading} />
      </Card>
    </PageLayout>
  );
}

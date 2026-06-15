import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "../components/ui/Button";
import { Input } from "../components/ui/Input";
import { Card } from "../components/ui/Card";
import { toast } from "../components/ui/Toast";
import { completeSetup } from "../lib/api";
import { WHY_OPTIONS, TEAM_OPTIONS } from "../lib/constants";

const TOTAL_STEPS = 10;

function StepIndicator({ current, total }) {
  return (
    <div className="flex items-center gap-1.5">
      {Array.from({ length: total }, (_, i) => (
        <div key={i} className={`h-1.5 rounded-full transition-all ${
          i < current ? "bg-brand-500 w-5" : i === current ? "bg-brand-400 w-8" : "bg-surface-3 w-3"
        }`} />
      ))}
    </div>
  );
}

function TagList({ items, onRemove }) {
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {items.map(item => (
        <span key={item} className="flex items-center gap-1 px-2 py-0.5 bg-surface-3 rounded text-xs text-ink">
          {item}
          <button onClick={() => onRemove(item)} className="text-ink-faint hover:text-red-400 ml-0.5 text-sm">×</button>
        </span>
      ))}
    </div>
  );
}

function AddList({ label, placeholder, items, setItems }) {
  const [val, setVal] = useState("");
  const add = () => {
    if (!val.trim() || items.includes(val.trim())) return;
    setItems(l => [...l, val.trim()]); setVal("");
  };
  return (
    <div className="flex flex-col gap-1">
      <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</label>
      <div className="flex gap-2">
        <input value={val} onChange={e => setVal(e.target.value)}
          onKeyDown={e => e.key === "Enter" && (e.preventDefault(), add())}
          className="flex-1 bg-surface-2 border border-surface-4 rounded px-3 py-2 text-sm text-ink focus:outline-none focus:ring-2 focus:ring-brand-500/50"
          placeholder={placeholder} />
        <Button size="sm" variant="outline" onClick={add}>Add</Button>
      </div>
      <TagList items={items} onRemove={i => setItems(l => l.filter(x => x !== i))} />
    </div>
  );
}

export default function SetupWizard() {
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  // All config state
  const [spreadsheetId, setSpreadsheetId] = useState("");
  const [alertEmails, setAlertEmails]     = useState([]);
  const [rexiSkus, setRexiSkus]           = useState([]);
  const [labMappings, setLabMappings]     = useState([{ rexiSku: "", labName: "" }]);
  const [ventItems, setVentItems]         = useState([]);
  const [hairIdMappings, setHairIdMappings] = useState([{ product: "", initials: "" }]);
  const [stylistProducts, setStylistProducts] = useState([]);
  const [finalProducts, setFinalProducts] = useState([]);
  const [whyOptions, setWhyOptions]       = useState([...WHY_OPTIONS]);
  const [staff, setStaff]                 = useState([]);
  const [teams, setTeams]                 = useState([...TEAM_OPTIONS]);
  const [adminPassword, setAdminPassword] = useState("");

  const handleLabMappingChange = (i, field, val) => {
    setLabMappings(l => l.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };
  const handleHairIdMappingChange = (i, field, val) => {
    setHairIdMappings(l => l.map((m, idx) => idx === i ? { ...m, [field]: val } : m));
  };

  const canProceed = () => {
    if (step === 0 && !spreadsheetId.trim()) return false;
    if (step === 10 && adminPassword.length < 8) return false;
    return true;
  };

  const handleFinish = async () => {
    if (adminPassword.length < 8) { toast("Admin password must be at least 8 characters.", "warning"); return; }
    setSaving(true);
    try {
      await completeSetup({
        spreadsheetId, alertEmails, rexiSkus, labMappings,
        ventItems, hairIdMappings, stylistProducts, finalProducts,
        whyOptions, staff, teams, adminPassword,
      });
      localStorage.setItem("tsl_setup_done", "1");
      toast("Setup complete! TSL is ready.", "success");
      setTimeout(() => navigate("/"), 1500);
    } catch { toast("Setup failed. Check your Apps Script URL and try again.", "error"); }
    finally { setSaving(false); }
  };

  const STEPS = [
    {
      title: "Google Sheets Connection",
      subtitle: "Paste your Spreadsheet ID",
      content: (
        <div className="flex flex-col gap-4">
          <Input label="Spreadsheet ID *"
            value={spreadsheetId} onChange={e => setSpreadsheetId(e.target.value)}
            helper="Found in the URL: docs.google.com/spreadsheets/d/[ID]/edit"
            placeholder="1BxiMVs0XRA5nFMdKvBdBZjgmUUqptlbs74OgVE2upms" />
          <p className="text-xs text-ink-muted bg-surface-2 rounded px-3 py-2">
            All 16 sheet tabs must already exist in the workbook. Refer to the Deployment Guide for the full tab list.
          </p>
        </div>
      )
    },
    {
      title: "Email Alerts",
      subtitle: "Who receives mismatch and flag alerts",
      content: <AddList label="Alert Email Addresses" placeholder="name@example.com" items={alertEmails} setItems={setAlertEmails} />
    },
    {
      title: "ReXI Configuration",
      subtitle: "Initial SKU / product code list",
      content: <AddList label="ReXI SKU List" placeholder="e.g. Rexi-Straight-Hair-18Inches-Merlot" items={rexiSkus} setItems={setRexiSkus} />
    },
    {
      title: "Lab SKU Mappings",
      subtitle: "Maps each ReXI SKU to its Lab output name",
      content: (
        <div className="flex flex-col gap-3">
          {labMappings.map((m, i) => (
            <div key={i} className="flex gap-2 items-end">
              <Input label={i === 0 ? "ReXI SKU" : ""} value={m.rexiSku} placeholder="ReXI SKU"
                onChange={e => handleLabMappingChange(i, "rexiSku", e.target.value)} />
              <span className="pb-2 text-ink-faint">→</span>
              <Input label={i === 0 ? "Lab Output Name" : ""} value={m.labName} placeholder="Lab name"
                onChange={e => handleLabMappingChange(i, "labName", e.target.value)} />
              <button onClick={() => setLabMappings(l => l.filter((_, idx) => idx !== i))}
                className="pb-2 text-red-400 hover:text-red-300 text-lg">×</button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-fit"
            onClick={() => setLabMappings(l => [...l, { rexiSku: "", labName: "" }])}>+ Add Row</Button>
        </div>
      )
    },
    {
      title: "Ventilation Setup",
      subtitle: "Items the Ventilation dept works with",
      content: <AddList label="Ventilation Items" placeholder="Item name…" items={ventItems} setItems={setVentItems} />
    },
    {
      title: "Tailor / Machine Sewer",
      subtitle: "Product shorthand initials for Hair ID generation",
      content: (
        <div className="flex flex-col gap-3">
          <p className="text-xs text-ink-muted">e.g. product "Spicy Icon Black/Merlot" → initials "SPYC-BL/M" → Hair ID: SPYC-BL/M-7231</p>
          {hairIdMappings.map((m, i) => (
            <div key={i} className="flex gap-2 items-end">
              <Input label={i === 0 ? "Product Name" : ""} value={m.product} placeholder="Product name"
                onChange={e => handleHairIdMappingChange(i, "product", e.target.value)} />
              <span className="pb-2 text-ink-faint">→</span>
              <Input label={i === 0 ? "Initials" : ""} value={m.initials} placeholder="e.g. SPYC-BL/M"
                onChange={e => handleHairIdMappingChange(i, "initials", e.target.value)} />
              <button onClick={() => setHairIdMappings(l => l.filter((_, idx) => idx !== i))}
                className="pb-2 text-red-400 hover:text-red-300 text-lg">×</button>
            </div>
          ))}
          <Button size="sm" variant="outline" className="w-fit"
            onClick={() => setHairIdMappings(l => [...l, { product: "", initials: "" }])}>+ Add Row</Button>
        </div>
      )
    },
    {
      title: "Stylist Setup",
      subtitle: "Product list for Stylist module",
      content: <AddList label="Stylist Products" placeholder="Product name…" items={stylistProducts} setItems={setStylistProducts} />
    },
    {
      title: "Final Prod Setup",
      subtitle: "Final product name list",
      content: <AddList label="Final Products" placeholder="Product name…" items={finalProducts} setItems={setFinalProducts} />
    },
    {
      title: "Why Dropdown",
      subtitle: "Pre-loaded with defaults — add or remove as needed",
      content: <AddList label="Why Options" placeholder="New reason…" items={whyOptions} setItems={setWhyOptions} />
    },
    {
      title: "Teams & Staff",
      subtitle: "Populates Team and Staff dropdowns across all modules",
      content: (
        <div className="flex flex-col gap-5">
          <AddList label="Teams" placeholder="Team name…" items={teams} setItems={setTeams} />
          <AddList label="Staff Members" placeholder="Staff name…" items={staff} setItems={setStaff} />
          <Input label="Admin Password (min 8 chars) *" type="password"
            value={adminPassword} onChange={e => setAdminPassword(e.target.value)}
            helper="Keep this secure. Required to access Admin Dashboard." />
        </div>
      )
    },
  ];

  const current = STEPS[step];

  return (
    <div className="min-h-screen bg-surface flex items-center justify-center p-4">
      <div className="w-full max-w-xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8 justify-center">
          <span className="w-9 h-9 rounded-lg bg-brand-500 flex items-center justify-center text-white font-bold">T</span>
          <span className="text-xl font-semibold text-ink">TSL Setup Wizard</span>
        </div>

        <Card>
          <div className="flex flex-col gap-1 mb-6">
            <div className="flex items-center justify-between">
              <p className="text-xs text-ink-muted">Step {step + 1} of {TOTAL_STEPS}</p>
              <StepIndicator current={step} total={TOTAL_STEPS} />
            </div>
            <h2 className="text-base font-semibold text-ink mt-2">{current.title}</h2>
            <p className="text-xs text-ink-muted">{current.subtitle}</p>
          </div>

          <div className="mb-6">{current.content}</div>

          <div className="flex justify-between pt-4 border-t border-surface-3">
            <Button variant="ghost" onClick={() => setStep(s => s - 1)} disabled={step === 0}>← Back</Button>
            {step < TOTAL_STEPS - 1 ? (
              <Button onClick={() => setStep(s => s + 1)} disabled={!canProceed()}>Next →</Button>
            ) : (
              <Button onClick={handleFinish} loading={saving} disabled={adminPassword.length < 8}>
                Complete Setup ✓
              </Button>
            )}
          </div>
        </Card>

        <p className="text-center text-xs text-ink-faint mt-4">
          All settings are editable after setup via the Admin Dashboard.
        </p>
      </div>
    </div>
  );
}

import { useState, useEffect } from "react";
import { Input, Select, Textarea } from "../ui/Input";
import { Button } from "../ui/Button";
import { WHY_OPTIONS, TEAM_OPTIONS, MONTHS } from "../../lib/constants";

// 1. API Imports (Draft actions)
import { saveDraft, loadDraft, clearDraft } from "../../lib/api";

// 2. Utils Imports (Helper functions)
import { today, currentMonth } from "../../lib/utils";

export function ProdForm({
  module,        // string key for draft storage
  fields,        // [{name, label, type, options, required, readOnly, helper}]
  onSubmit,      // async fn(data) => void
  submitLabel = "Submit Entry",
  loading = false,
  adminFields = [], // field names that require admin (greyed out for staff)
  isAdmin = false,
}) {
  const initData = () => {
    const d = { date: today(), month: currentMonth() };
    fields.forEach(f => { if (!d[f.name]) d[f.name] = f.default || ""; });
    return d;
  };

  const [data, setData]       = useState(initData);
  const [errors, setErrors]   = useState({});
  const [restored, setRestored] = useState(false);

  // Restore draft on mount
  useEffect(() => {
    const draft = loadDraft(module);
    if (draft) {
      const restore = window.confirm("Restore saved draft?");
      if (restore) { setData(draft); setRestored(true); }
      else clearDraft(module);
    }
  }, []); // eslint-disable-line

  // Auto-save draft on change
  useEffect(() => { saveDraft(module, data); }, [data, module]);

  const set = (name, val) => setData(d => ({ ...d, [name]: val }));

  const validate = () => {
    const errs = {};
    fields.forEach(f => {
      if (f.required && !data[f.name]) errs[f.name] = "Required";
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      await onSubmit(data);
      clearDraft(module);
      setData(initData());
      setErrors({});
    } catch (err) {
      // parent handles toast
    }
  };

  const renderField = (f) => {
    const locked = adminFields.includes(f.name) && !isAdmin;
    const common = {
      label: f.label + (f.required ? " *" : ""),
      value: data[f.name],
      disabled: locked || f.readOnly || loading,
      error: errors[f.name],
      helper: locked ? "Admin only" : f.helper,
    };

    if (f.type === "select") {
      return (
        <Select key={f.name} {...common} onChange={e => set(f.name, e.target.value)}>
          {(f.options || []).map(o => <option key={o} value={o}>{o}</option>)}
        </Select>
      );
    }
    if (f.type === "textarea") {
      return <Textarea key={f.name} {...common} onChange={e => set(f.name, e.target.value)} />;
    }
    if (f.type === "number") {
      return <Input key={f.name} type="number" min="0" {...common} onChange={e => set(f.name, e.target.value)} />;
    }
    return <Input key={f.name} type={f.type || "text"} {...common} onChange={e => set(f.name, e.target.value)} />;
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
      {restored && (
        <p className="text-xs text-amber-400 bg-amber-900/20 border border-amber-700/30 rounded px-3 py-2">
          Draft restored from previous session.
        </p>
      )}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Input label="Date *" type="date" value={data.date} onChange={e => set("date", e.target.value)} />
        <Select label="Month *" value={data.month} onChange={e => set("month", e.target.value)}>
          {MONTHS.map(m => <option key={m} value={m}>{m}</option>)}
        </Select>
        {fields.map(renderField)}
      </div>
      <div className="flex justify-end pt-2">
        <Button type="submit" loading={loading} disabled={loading}>{submitLabel}</Button>
      </div>
    </form>
  );
}

import { cx } from "../../lib/utils";

export function Input({ label, error, helper, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</label>}
      <input
        className={cx(
          "bg-surface-2 border rounded px-3 py-2 text-sm text-ink placeholder-ink-faint",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
          error ? "border-red-500" : "border-surface-4",
          className
        )}
        {...props}
      />
      {error  && <p className="text-xs text-red-400">{error}</p>}
      {helper && <p className="text-xs text-ink-muted">{helper}</p>}
    </div>
  );
}

export function Select({ label, error, helper, children, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</label>}
      <select
        className={cx(
          "bg-surface-2 border rounded px-3 py-2 text-sm text-ink",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
          error ? "border-red-500" : "border-surface-4",
          className
        )}
        {...props}
      >
        <option value="">— Select —</option>
        {children}
      </select>
      {error  && <p className="text-xs text-red-400">{error}</p>}
      {helper && <p className="text-xs text-ink-muted">{helper}</p>}
    </div>
  );
}

export function Textarea({ label, error, helper, className = "", ...props }) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-xs font-medium text-ink-muted uppercase tracking-wide">{label}</label>}
      <textarea
        className={cx(
          "bg-surface-2 border rounded px-3 py-2 text-sm text-ink placeholder-ink-faint resize-none",
          "focus:outline-none focus:ring-2 focus:ring-brand-500/50 focus:border-brand-500",
          error ? "border-red-500" : "border-surface-4",
          className
        )}
        rows={3}
        {...props}
      />
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}

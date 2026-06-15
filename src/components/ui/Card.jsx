import { cx } from "../../lib/utils";
export function Card({ children, className = "", padding = true }) {
  return (
    <div className={cx("bg-surface-1 border border-surface-3 rounded-lg", padding && "p-5", className)}>
      {children}
    </div>
  );
}
export function CardHeader({ title, subtitle, action }) {
  return (
    <div className="flex items-start justify-between mb-4">
      <div>
        <h3 className="text-sm font-semibold text-ink">{title}</h3>
        {subtitle && <p className="text-xs text-ink-muted mt-0.5">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

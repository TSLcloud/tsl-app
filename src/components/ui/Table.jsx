import { cx } from "../../lib/utils";

export function Table({ children, className = "" }) {
  return (
    <div className={cx("overflow-x-auto rounded-lg border border-surface-3", className)}>
      <table className="w-full text-sm border-collapse">{children}</table>
    </div>
  );
}
export function Th({ children, className = "" }) {
  return (
    <th className={cx("px-3 py-2.5 text-left text-xs font-semibold text-ink-muted uppercase tracking-wide bg-surface-2 border-b border-surface-3 whitespace-nowrap", className)}>
      {children}
    </th>
  );
}
export function Td({ children, className = "", flagged }) {
  return (
    <td className={cx("px-3 py-2.5 border-b border-surface-3/50 text-ink whitespace-nowrap", flagged && "bg-red-900/20 text-red-300", className)}>
      {children}
    </td>
  );
}
export function Tr({ children, className = "", flagged }) {
  return (
    <tr className={cx("hover:bg-surface-2/50 transition-colors", flagged && "bg-red-900/10", className)}>
      {children}
    </tr>
  );
}

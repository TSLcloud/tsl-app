import { cx } from "../../lib/utils";

export function Button({ children, variant = "primary", size = "md", disabled, loading, onClick, type = "button", className = "" }) {
  const base = "inline-flex items-center justify-center font-medium rounded transition-all focus:outline-none focus:ring-2 focus:ring-brand-500/50 disabled:opacity-50 disabled:cursor-not-allowed";
  const variants = {
    primary:  "bg-brand-500 hover:bg-brand-600 text-white",
    secondary:"bg-surface-3 hover:bg-surface-4 text-ink border border-surface-4",
    danger:   "bg-red-600 hover:bg-red-700 text-white",
    ghost:    "hover:bg-surface-2 text-ink-muted hover:text-ink",
    outline:  "border border-surface-4 hover:border-brand-500 text-ink-muted hover:text-brand-300",
  };
  const sizes = { xs: "px-2 py-1 text-xs gap-1", sm: "px-3 py-1.5 text-sm gap-1.5", md: "px-4 py-2 text-sm gap-2", lg: "px-5 py-2.5 text-base gap-2" };
  return (
    <button type={type} disabled={disabled || loading} onClick={onClick}
      className={cx(base, variants[variant], sizes[size], className)}>
      {loading && <span className="w-3.5 h-3.5 border-2 border-current border-t-transparent rounded-full animate-spin" />}
      {children}
    </button>
  );
}

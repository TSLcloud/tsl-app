export function Badge({ children, variant = "default", size = "sm" }) {
  const variants = {
    default:  "bg-surface-3 text-ink-muted",
    success:  "bg-green-900/40 text-green-400 border border-green-700/40",
    warning:  "bg-amber-900/40 text-amber-400 border border-amber-700/40",
    danger:   "bg-red-900/40 text-red-400 border border-red-700/40",
    info:     "bg-blue-900/40 text-blue-400 border border-blue-700/40",
    brand:    "bg-brand-600/20 text-brand-300 border border-brand-600/40",
  };
  const sizes = { xs: "px-1.5 py-0.5 text-[10px]", sm: "px-2 py-0.5 text-xs", md: "px-2.5 py-1 text-sm" };
  return (
    <span className={`inline-flex items-center rounded font-medium ${variants[variant]} ${sizes[size]}`}>
      {children}
    </span>
  );
}

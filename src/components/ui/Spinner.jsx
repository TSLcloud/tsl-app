export function Spinner({ size = "md", className = "" }) {
  const sizes = { sm: "w-4 h-4 border-2", md: "w-6 h-6 border-2", lg: "w-10 h-10 border-[3px]" };
  return <span className={`inline-block rounded-full border-brand-500 border-t-transparent animate-spin ${sizes[size]} ${className}`} />;
}

export function LoadingState({ message = "Loading…" }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-ink-muted">
      <Spinner size="lg" />
      <span className="text-sm">{message}</span>
    </div>
  );
}

export function EmptyState({ icon = "📭", title, message, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-16 gap-3 text-center">
      <span className="text-4xl">{icon}</span>
      <h3 className="text-sm font-semibold text-ink">{title}</h3>
      {message && <p className="text-xs text-ink-muted max-w-xs">{message}</p>}
      {action}
    </div>
  );
}

import { useState, useCallback, useEffect } from "react";

let toastFn = null;
export function toast(msg, type = "info", duration = 4000) {
  if (toastFn) toastFn({ msg, type, duration, id: Date.now() });
}

export function ToastContainer() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    toastFn = (t) => {
      setToasts(prev => [...prev, t]);
      setTimeout(() => setToasts(prev => prev.filter(x => x.id !== t.id)), t.duration);
    };
  }, []);

  const icons = { success: "✓", error: "✕", warning: "⚠", info: "ℹ" };
  const colors = {
    success: "bg-green-900/80 border-green-600/40 text-green-200",
    error:   "bg-red-900/80 border-red-600/40 text-red-200",
    warning: "bg-amber-900/80 border-amber-600/40 text-amber-200",
    info:    "bg-surface-2 border-surface-4 text-ink",
  };

  return (
    <div className="fixed bottom-4 right-4 z-[100] flex flex-col gap-2 pointer-events-none">
      {toasts.map(t => (
        <div key={t.id} className={`flex items-center gap-2 px-4 py-3 rounded-lg border text-sm font-medium shadow-xl backdrop-blur-sm pointer-events-auto ${colors[t.type]}`}>
          <span>{icons[t.type]}</span>
          <span>{t.msg}</span>
        </div>
      ))}
    </div>
  );
}

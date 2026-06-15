import { useOnlineStatus } from "../../hooks/useOnlineStatus";
import { today, formatDateTime } from "../../lib/utils";
import { Badge } from "../ui/Badge";

export function TopBar({ title, subtitle }) {
  const { online, queueCount, flushing, lastSync } = useOnlineStatus();

  return (
    <header className="h-14 bg-surface-1/80 backdrop-blur border-b border-surface-3 flex items-center justify-between px-6 sticky top-0 z-20">
      <div>
        <h1 className="text-sm font-semibold text-ink">{title}</h1>
        {subtitle && <p className="text-xs text-ink-muted">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-3">
        <span className="text-xs text-ink-faint font-mono">{today()}</span>
        {!online && queueCount > 0 && (
          <Badge variant="warning">OFFLINE — {queueCount} queued</Badge>
        )}
        {!online && queueCount === 0 && (
          <Badge variant="warning">OFFLINE</Badge>
        )}
        {flushing && <Badge variant="info">Syncing…</Badge>}
        {online && queueCount === 0 && !flushing && (
          <Badge variant="success">Live</Badge>
        )}
        {lastSync && (
          <span className="text-[10px] text-ink-faint">Synced {formatDateTime(lastSync)}</span>
        )}
      </div>
    </header>
  );
}

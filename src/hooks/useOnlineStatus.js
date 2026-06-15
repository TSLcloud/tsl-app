import { useState, useEffect } from "react";
import { flushQueue, getQueue } from "../lib/api";

export function useOnlineStatus() {
  const [online, setOnline] = useState(navigator.onLine);
  const [queueCount, setQueueCount] = useState(getQueue().length);
  const [flushing, setFlushing] = useState(false);
  const [lastSync, setLastSync] = useState(null);

  useEffect(() => {
    const handleOnline = async () => {
      setOnline(true);
      const q = getQueue();
      if (q.length > 0) {
        setFlushing(true);
        await flushQueue((done, total) => setQueueCount(total - done));
        setQueueCount(0);
        setFlushing(false);
        setLastSync(new Date());
      }
    };
    const handleOffline = () => { setOnline(false); setQueueCount(getQueue().length); };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);
    return () => { window.removeEventListener("online", handleOnline); window.removeEventListener("offline", handleOffline); };
  }, []);

  useEffect(() => {
    const id = setInterval(() => setQueueCount(getQueue().length), 2000);
    return () => clearInterval(id);
  }, []);

  return { online, queueCount, flushing, lastSync };
}

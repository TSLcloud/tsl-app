import { useState, useCallback } from "react";
import { adminAuth } from "../lib/api";

const TOKEN_KEY = "tsl_admin_token";
const LOCK_KEY  = "tsl_admin_lock";

export function useAdminAuth() {
  const [token, setToken]   = useState(() => sessionStorage.getItem(TOKEN_KEY));
  const [locked, setLocked] = useState(() => {
    const lock = JSON.parse(localStorage.getItem(LOCK_KEY) || "null");
    if (!lock) return false;
    return Date.now() - lock.ts < 5 * 60 * 1000; // 5 min lockout
  });
  const [attempts, setAttempts] = useState(0);
  const [error, setError]   = useState("");

  const login = useCallback(async (password) => {
    if (locked) { setError("Too many failed attempts. Wait 5 minutes."); return false; }
    try {
      const res = await adminAuth(password);
      if (res.success && res.token) {
        sessionStorage.setItem(TOKEN_KEY, res.token);
        setToken(res.token);
        setAttempts(0);
        setError("");
        localStorage.removeItem(LOCK_KEY);
        return true;
      } else {
        const next = attempts + 1;
        setAttempts(next);
        if (next >= 3) {
          localStorage.setItem(LOCK_KEY, JSON.stringify({ ts: Date.now() }));
          setLocked(true);
          setError("Too many failed attempts. Locked for 5 minutes.");
        } else {
          setError(`Incorrect password. ${3 - next} attempt${3 - next === 1 ? "" : "s"} remaining.`);
        }
        return false;
      }
    } catch {
      setError("Unable to connect. Check your internet connection.");
      return false;
    }
  }, [locked, attempts]);

  const logout = useCallback(() => {
    sessionStorage.removeItem(TOKEN_KEY);
    setToken(null);
    setError("");
  }, []);

  return { token, locked, error, login, logout, isAuthenticated: !!token };
}

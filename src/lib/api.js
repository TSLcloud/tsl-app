// ─── TSL API LAYER ────────────────────────────────────────────────────────────
// All communication with Google Apps Script goes through here.
// Handles offline queue, retry with backoff, and response parsing.

const SCRIPT_URL = process.env.REACT_APP_SCRIPT_URL;
const QUEUE_KEY  = "tsl_offline_queue";
const DRAFT_KEY  = "tsl_draft_";

// ── Offline Queue ─────────────────────────────────────────────────────────────
export function getQueue() {
  try { return JSON.parse(localStorage.getItem(QUEUE_KEY) || "[]"); }
  catch { return []; }
}
function saveQueue(q) { localStorage.setItem(QUEUE_KEY, JSON.stringify(q)); }
function enqueue(payload) {
  const q = getQueue();
  q.push({ id: Date.now(), payload, ts: new Date().toISOString() });
  saveQueue(q);
}
function dequeue(id) {
  const q = getQueue().filter(i => i.id !== id);
  saveQueue(q);
}

// ── Draft persistence ─────────────────────────────────────────────────────────
export function saveDraft(module, data) {
  localStorage.setItem(DRAFT_KEY + module, JSON.stringify({ data, ts: Date.now() }));
}
export function loadDraft(module) {
  try {
    const raw = localStorage.getItem(DRAFT_KEY + module);
    if (!raw) return null;
    const { data, ts } = JSON.parse(raw);
    if (Date.now() - ts > 24 * 3600 * 1000) { clearDraft(module); return null; }
    return data;
  } catch { return null; }
}
export function clearDraft(module) { localStorage.removeItem(DRAFT_KEY + module); }

// ── Fetch with retry + backoff ────────────────────────────────────────────────
async function fetchWithRetry(url, options, attempts = 3) {
  for (let i = 0; i < attempts; i++) {
    try {
      const res = await fetch(url, options);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      return await res.json();
    } catch (err) {
      if (i === attempts - 1) throw err;
      await new Promise(r => setTimeout(r, (2 ** i) * 1000));
    }
  }
}

// ── Core request ─────────────────────────────────────────────────────────────
async function request(action, params = {}) {
  if (!navigator.onLine) throw new Error("OFFLINE");
  const body = JSON.stringify({ action, ...params });
  return fetchWithRetry(SCRIPT_URL, {
    method: "POST",
    headers: { "Content-Type": "text/plain" },
    body,
  });
}

// ── Flush offline queue ───────────────────────────────────────────────────────
export async function flushQueue(onProgress) {
  const q = getQueue();
  let flushed = 0;
  for (const item of q) {
    try {
      await fetchWithRetry(SCRIPT_URL, {
        method: "POST",
        headers: { "Content-Type": "text/plain" },
        body: JSON.stringify(item.payload),
      });
      dequeue(item.id);
      flushed++;
      if (onProgress) onProgress(flushed, q.length);
    } catch (e) {
      break; // stop on first failure, retry later
    }
  }
  return flushed;
}

// ═══════════════════════════════════════════════════════════════════════════════
// PUBLIC API METHODS
// ═══════════════════════════════════════════════════════════════════════════════

// ── Write a production entry ──────────────────────────────────────────────────
export async function writeProdEntry(sheet, row) {
  const payload = { action: "writeProdEntry", sheet, row };
  if (!navigator.onLine) { enqueue(payload); return { queued: true }; }
  try {
    return await request("writeProdEntry", { sheet, row });
  } catch (err) {
    if (!navigator.onLine || err.message === "OFFLINE") {
      enqueue(payload); return { queued: true };
    }
    throw err;
  }
}

// ── Read prod entries ─────────────────────────────────────────────────────────
export async function getProdEntries(sheet, filters = {}) {
  return request("getProdEntries", { sheet, filters });
}

// ── Get inventory ─────────────────────────────────────────────────────────────
export async function getInventory(sheet) {
  return request("getInventory", { sheet });
}

// ── Generate Hair ID ──────────────────────────────────────────────────────────
export async function generateHairID(productCode, staffName) {
  return request("generateHairID", { productCode, staffName });
}

// ── Validate mismatch ─────────────────────────────────────────────────────────
export async function validateMismatch(sheet, entry) {
  return request("validateMismatch", { sheet, entry });
}

// ── KPI data for Home ─────────────────────────────────────────────────────────
export async function getKPIs() {
  return request("getKPIs");
}

// ── Analytics ─────────────────────────────────────────────────────────────────
export async function getAnalytics(filters) {
  return request("getAnalytics", { filters });
}

// ── Trace Hair ID lineage ─────────────────────────────────────────────────────
export async function traceHairID(hairId) {
  return request("traceHairID", { hairId });
}

// ── Admin auth ────────────────────────────────────────────────────────────────
// ── Admin auth ────────────────────────────────────────────────────────────────────────────────
export async function adminAuth(password) {
  const url = `${SCRIPT_URL}?action=adminAuth&password=${encodeURIComponent(password)}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
;
}

// ── Get config ────────────────────────────────────────────────────────────────
export async function getConfig(key) {
  return request("getConfig", { key });
}

// ── Save config ───────────────────────────────────────────────────────────────
export async function saveConfig(key, value, adminToken) {
  return request("saveConfig", { key, value, adminToken });
}

// ── Get audit trail ───────────────────────────────────────────────────────────
export async function getAuditTrail(limit = 200) {
  return request("getAuditTrail", { limit });
}

// ── Get all config (Admin Dashboard) ─────────────────────────────────────────
export async function getAllConfig(adminToken) {
  return request("getAllConfig", { adminToken });
}

// ── Lookup Hair ID ────────────────────────────────────────────────────────────
export async function lookupHairID(hairId) {
  return request("lookupHairID", { hairId });
}

// ── Setup wizard complete ─────────────────────────────────────────────────────
export async function completeSetup(config) {
  return request("completeSetup", { config });
}

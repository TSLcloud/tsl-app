import { format, startOfMonth, endOfMonth, subMonths } from "date-fns";
import { MONTHS } from "./constants";

export function today() { return format(new Date(), "yyyy-MM-dd"); }
export function currentMonth() { return MONTHS[new Date().getMonth()]; }
export function prevMonth() { return MONTHS[subMonths(new Date(), 1).getMonth()]; }

export function formatDate(d) {
  if (!d) return "";
  try { return format(new Date(d), "dd MMM yyyy"); }
  catch { return d; }
}

export function formatDateTime(d) {
  if (!d) return "";
  try { return format(new Date(d), "dd MMM yyyy HH:mm"); }
  catch { return d; }
}

// Generate a unique 4-digit suffix for Hair IDs
export function randomFourDigit() {
  return String(Math.floor(1000 + Math.random() * 9000));
}

// Trend direction
export function trendDir(current, previous) {
  if (current > previous) return "up";
  if (current < previous) return "down";
  return "flat";
}

export function pctChange(current, previous) {
  if (!previous) return null;
  return (((current - previous) / previous) * 100).toFixed(1);
}

// Debounce
export function debounce(fn, ms) {
  let timer;
  return (...args) => { clearTimeout(timer); timer = setTimeout(() => fn(...args), ms); };
}

// CSV export
export function exportCSV(rows, filename) {
  if (!rows.length) return;
  const headers = Object.keys(rows[0]);
  const csv = [
    headers.join(","),
    ...rows.map(r => headers.map(h => `"${String(r[h] ?? "").replace(/"/g, '""')}"`).join(","))
  ].join("\n");
  const blob = new Blob([csv], { type: "text/csv" });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement("a");
  a.href = url;
  a.download = `${filename}_${format(new Date(), "yyyyMMdd_HHmm")}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Print label (thermal printer)
export function printHairIDLabel(hairId) {
  const area = document.getElementById("label-print-area");
  if (area) { area.textContent = hairId; window.print(); }
}

// Class merge helper
export function cx(...classes) { return classes.filter(Boolean).join(" "); }

import { PERIOD_WEEKS } from "../constants";

// Generate unique ID
export function uid() {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
}

// Date range functions
export function getWeekRange(offset = 0) {
  const d = new Date();
  const day = d.getDay(); // 0=Sun … 6=Sat
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1) + offset * 7);
  const end = new Date(d);
  end.setDate(end.getDate() + 6);
  return {
    start: d,
    end: end,
    key: d.toISOString().split("T")[0],
    label: `${d.toLocaleString("default", { month: "short" })} ${String(d.getDate()).padStart(2, "0")} – ${end.toLocaleString("default", { month: "short" })} ${String(end.getDate()).padStart(2, "0")}`
  };
}

export function getMonthRange(offset = 0) {
  const d = new Date();
  d.setDate(1);
  d.setMonth(d.getMonth() + offset);
  return {
    key: d.toISOString().slice(0, 7),
    label: d.toLocaleString("default", { month: "short", year: "2-digit" })
  };
}

export function getQuarterRange(offset = 0) {
  const d = new Date();
  const totalQ = d.getFullYear() * 4 + Math.floor(d.getMonth() / 3) + offset;
  const yr = Math.floor(totalQ / 4);
  const qn = ((totalQ % 4) + 4) % 4;
  return {
    key: `${yr}-Q${qn + 1}`,
    label: `Q${qn + 1} '${String(yr).slice(2)}`
  };
}

export function getYearRange(offset = 0) {
  const yr = new Date().getFullYear() + offset;
  return { key: String(yr), label: String(yr) };
}

export function getYTDPeriods() {
  const today = new Date();
  const yearStart = new Date(today.getFullYear(), 0, 1);
  const d = new Date(yearStart);
  const day = d.getDay();
  d.setDate(d.getDate() - (day === 0 ? 6 : day - 1));
  const periods = [];
  while (d <= today) {
    const key = d.toISOString().split("T")[0];
    const end = new Date(d);
    end.setDate(end.getDate() + 6);
    const label = `${d.toLocaleString("default", { month: "short" })} ${String(d.getDate()).padStart(2, "0")} – ${end.toLocaleString("default", { month: "short" })} ${String(end.getDate()).padStart(2, "0")}`;
    periods.push({ key, label });
    d.setDate(d.getDate() + 7);
  }
  return periods.reverse();
}

export function getPeriods(tab) {
  if (tab === "ytd") {
    const yr = new Date().getFullYear();
    return [{ key: String(yr), label: `YTD ${yr}` }];
  }
  if (tab === "monthly") return Array.from({ length: 12 }, (_, i) => getMonthRange(-i));
  if (tab === "quarterly") return Array.from({ length: 8 }, (_, i) => getQuarterRange(-i));
  if (tab === "annual") return Array.from({ length: 5 }, (_, i) => getYearRange(-i));
  return Array.from({ length: 52 }, (_, i) => getWeekRange(-i));
}

// Check if weekly key belongs to a period.
// Uses the Thursday of the week (ISO standard) to determine which month/quarter/year
// the week belongs to — avoids misattributing cross-boundary weeks.
export function weekBelongsTo(weekKey, periodKey, tab) {
  const thu = new Date(weekKey + "T00:00:00");
  thu.setDate(thu.getDate() + 3); // Monday + 3 = Thursday
  const thuYear = thu.getFullYear();
  const thuMonth = String(thu.getMonth() + 1).padStart(2, "0");
  const thuQ = Math.floor(thu.getMonth() / 3) + 1;

  if (tab === "monthly") return `${thuYear}-${thuMonth}` === periodKey;
  if (tab === "quarterly") {
    const yr = periodKey.slice(0, 4);
    const qn = parseInt(periodKey.slice(6));
    return String(thuYear) === yr && thuQ === qn;
  }
  if (tab === "annual" || tab === "ytd") return String(thuYear) === periodKey;
  return false;
}

// Get rollup value for scorecard
export function getRollupVal(mid, periodKey, tab, scData, unit) {
  const weekKeys = Object.keys(scData).filter(
    k => /^\d{4}-\d{2}-\d{2}$/.test(k) && weekBelongsTo(k, periodKey, tab)
  );
  const vals = weekKeys.map(wk => parseFloat(scData[wk]?.[mid])).filter(v => !isNaN(v));
  if (!vals.length) return "";
  const result = unit === "%" 
    ? vals.reduce((a, b) => a + b, 0) / vals.length
    : vals.reduce((a, b) => a + b, 0);
  return Math.round(result * 100) / 100;
}

// Scale goal to period
export function scaleGoal(metric, tab) {
  if (metric.unit === "%") return metric.goal;
  if (tab === "ytd") {
    const now = new Date();
    const startOfYear = new Date(now.getFullYear(), 0, 1);
    const weeksElapsed = Math.max(1, Math.ceil((now - startOfYear) / (7 * 24 * 60 * 60 * 1000)));
    return Math.round(metric.goal * weeksElapsed);
  }
  return Math.round(metric.goal * (PERIOD_WEEKS[tab] || 1));
}

// Split textarea content into a trimmed, non-empty list of lines
export function parseLines(text) {
  return String(text || "")
    .split("\n")
    .map(line => line.trim())
    .filter(Boolean);
}

// Completion progress for a rock's milestones
export function milestoneProgress(milestones) {
  const list = Array.isArray(milestones) ? milestones : [];
  return { done: list.filter(m => m.done).length, total: list.length };
}

// Current quarter label, e.g. "Q1 2026"
export function currentQuarterLabel(offset = 0) {
  const now = new Date();
  const totalQ = now.getFullYear() * 4 + Math.floor(now.getMonth() / 3) + offset;
  const yr = Math.floor(totalQ / 4);
  const qn = ((totalQ % 4) + 4) % 4;
  return `Q${qn + 1} ${yr}`;
}

// Format date
export function fmtDate(s) {
  if (!s) return "";
  const d = new Date(s + "T00:00:00");
  return d.toLocaleString("default", { month: "short" }) + " " + d.getDate();
}

// Check if overdue
export function isOverdue(s) {
  if (!s) return false;
  return new Date(s + "T23:59:59") < new Date();
}

// Storage operations (backed by localStorage)
export async function load(key, fallback) {
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch {
    return fallback;
  }
}

export async function save(key, value) {
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch (e) {
    console.error(e);
  }
}

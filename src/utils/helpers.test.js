import { describe, it, expect, beforeEach } from "vitest";
import {
  uid,
  getWeekRange,
  getMonthRange,
  getQuarterRange,
  getYearRange,
  weekBelongsTo,
  getRollupVal,
  scaleGoal,
  fmtDate,
  isOverdue,
  load,
  save
} from "./helpers";

describe("uid", () => {
  it("generates non-empty, unique-ish strings", () => {
    const a = uid();
    const b = uid();
    expect(typeof a).toBe("string");
    expect(a.length).toBeGreaterThan(0);
    expect(a).not.toBe(b);
  });
});

describe("getWeekRange", () => {
  it("returns a 7-day range starting on Monday", () => {
    const { start, end } = getWeekRange(0);
    expect(start.getDay()).toBe(1);
    expect((end - start) / (1000 * 60 * 60 * 24)).toBe(6);
  });

  it("uses key in YYYY-MM-DD format", () => {
    const { key } = getWeekRange(0);
    expect(key).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });
});

describe("getMonthRange", () => {
  it("uses key in YYYY-MM format", () => {
    const { key } = getMonthRange(0);
    expect(key).toMatch(/^\d{4}-\d{2}$/);
  });
});

describe("getQuarterRange", () => {
  it("wraps to the previous year when offset crosses a year boundary", () => {
    const now = new Date();
    const currentQuarter = Math.floor(now.getMonth() / 3);
    const { key } = getQuarterRange(-(currentQuarter + 1));
    const [yr] = key.split("-Q");
    expect(Number(yr)).toBe(now.getFullYear() - 1);
  });
});

describe("getYearRange", () => {
  it("offsets from the current year", () => {
    const thisYear = new Date().getFullYear();
    expect(getYearRange(0).key).toBe(String(thisYear));
    expect(getYearRange(-1).key).toBe(String(thisYear - 1));
  });
});

describe("weekBelongsTo", () => {
  it("matches monthly periods by prefix", () => {
    expect(weekBelongsTo("2024-03-15", "2024-03", "monthly")).toBe(true);
    expect(weekBelongsTo("2024-04-01", "2024-03", "monthly")).toBe(false);
  });

  it("matches quarterly periods by quarter month ranges", () => {
    expect(weekBelongsTo("2024-02-10", "2024-Q1", "quarterly")).toBe(true);
    expect(weekBelongsTo("2024-05-10", "2024-Q1", "quarterly")).toBe(false);
    expect(weekBelongsTo("2024-05-10", "2024-Q2", "quarterly")).toBe(true);
  });

  it("matches annual periods by year prefix", () => {
    expect(weekBelongsTo("2024-06-01", "2024", "annual")).toBe(true);
    expect(weekBelongsTo("2023-06-01", "2024", "annual")).toBe(false);
  });

  it("returns false for unknown tabs", () => {
    expect(weekBelongsTo("2024-06-01", "2024", "weekly")).toBe(false);
  });
});

describe("getRollupVal", () => {
  const scData = {
    "2024-03-04": { m1: "10", m2: "50" },
    "2024-03-11": { m1: "20", m2: "70" },
    "2024-04-01": { m1: "5" }
  };

  it("sums values for non-percent units within the period", () => {
    expect(getRollupVal("m1", "2024-03", "monthly", scData, "#")).toBe(30);
  });

  it("averages values for percent units within the period", () => {
    expect(getRollupVal("m2", "2024-03", "monthly", scData, "%")).toBe(60);
  });

  it("returns empty string when there is no data", () => {
    expect(getRollupVal("missing", "2024-03", "monthly", scData, "#")).toBe("");
  });
});

describe("scaleGoal", () => {
  it("leaves percent goals unscaled", () => {
    expect(scaleGoal({ unit: "%", goal: 90 }, "monthly")).toBe(90);
  });

  it("scales non-percent goals by the period's week count", () => {
    expect(scaleGoal({ unit: "#", goal: 10 }, "monthly")).toBe(43); // 4.33 weeks/month
    expect(scaleGoal({ unit: "#", goal: 10 }, "quarterly")).toBe(130);
  });
});

describe("fmtDate", () => {
  it("formats a YYYY-MM-DD string as 'Mon D'", () => {
    expect(fmtDate("2024-01-05")).toBe("Jan 5");
  });

  it("returns empty string for falsy input", () => {
    expect(fmtDate("")).toBe("");
    expect(fmtDate(null)).toBe("");
  });
});

describe("isOverdue", () => {
  it("returns false for falsy input", () => {
    expect(isOverdue("")).toBe(false);
  });

  it("returns true for a date in the past", () => {
    expect(isOverdue("2000-01-01")).toBe(true);
  });

  it("returns false for a date far in the future", () => {
    expect(isOverdue("2999-01-01")).toBe(false);
  });
});

describe("load/save", () => {
  beforeEach(() => {
    window.localStorage.clear();
  });

  it("round-trips a value through localStorage", async () => {
    await save("test-key", { a: 1 });
    const result = await load("test-key", null);
    expect(result).toEqual({ a: 1 });
  });

  it("returns the fallback when nothing is stored", async () => {
    const result = await load("missing-key", "fallback");
    expect(result).toBe("fallback");
  });

  it("returns the fallback when stored value is invalid JSON", async () => {
    window.localStorage.setItem("bad-key", "{not json");
    const result = await load("bad-key", "fallback");
    expect(result).toBe("fallback");
  });
});

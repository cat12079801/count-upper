import { describe, it, expect } from "vitest";
import {
  toDateStr,
  daysInMonth,
  monthRange,
  yearRange,
  ymLabel,
  maxLoggableDateStr,
} from "./date";

describe("toDateStr", () => {
  it("ローカル日付を YYYY-MM-DD にする（月は1始まり）", () => {
    // 月は 0 始まりなので 6 = 7月
    expect(toDateStr(new Date(2026, 6, 5))).toBe("2026-07-05");
    expect(toDateStr(new Date(2026, 0, 1))).toBe("2026-01-01");
    expect(toDateStr(new Date(2026, 11, 31))).toBe("2026-12-31");
  });
});

describe("daysInMonth", () => {
  it("各月の日数を返す", () => {
    expect(daysInMonth(2026, 1)).toBe(31);
    expect(daysInMonth(2026, 2)).toBe(28);
    expect(daysInMonth(2026, 4)).toBe(30);
    expect(daysInMonth(2026, 7)).toBe(31);
  });
  it("うるう年の2月は29日", () => {
    expect(daysInMonth(2024, 2)).toBe(29);
  });
});

describe("monthRange", () => {
  it("月の開始・終了・日数を返す", () => {
    expect(monthRange(2026, 7)).toEqual({
      start: "2026-07-01",
      end: "2026-07-31",
      days: 31,
    });
    expect(monthRange(2026, 2)).toEqual({
      start: "2026-02-01",
      end: "2026-02-28",
      days: 28,
    });
  });
});

describe("yearRange", () => {
  it("年の開始・終了を返す", () => {
    expect(yearRange(2026)).toEqual({
      start: "2026-01-01",
      end: "2026-12-31",
    });
  });
});

describe("ymLabel", () => {
  it("年月ラベルを返す", () => {
    expect(ymLabel(2026, 7)).toBe("2026年7月");
  });
});

describe("maxLoggableDateStr", () => {
  it("YYYY-MM-DD 形式で、UTC 今日以降を返す", () => {
    const s = maxLoggableDateStr();
    expect(s).toMatch(/^\d{4}-\d{2}-\d{2}$/);
    const now = new Date();
    const utcToday = `${now.getUTCFullYear()}-${String(now.getUTCMonth() + 1).padStart(2, "0")}-${String(now.getUTCDate()).padStart(2, "0")}`;
    // UTC 今日 + 1日 なので UTC 今日より後
    expect(s > utcToday).toBe(true);
  });
});

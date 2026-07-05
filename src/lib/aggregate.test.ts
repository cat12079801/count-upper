import { describe, it, expect } from "vitest";
import { aggregate } from "./aggregate";
import type { CountLog } from "@/types/db";

function log(logged_on: string, count: number): CountLog {
  return {
    id: `${logged_on}-${count}`,
    counter_id: "c1",
    user_id: "u1",
    count,
    logged_on,
    created_at: "",
  };
}

describe("aggregate - daily（1か月・日別）", () => {
  const logs = [
    log("2026-07-01", 10),
    log("2026-07-01", 5),
    log("2026-07-03", 7),
  ];
  const r = aggregate(logs, "daily", 2026, 7);

  it("チャート長は月の日数", () => {
    expect(r.chart).toHaveLength(31);
  });
  it("同一日は合算される", () => {
    expect(r.chart[0]).toEqual({ label: "1", value: 15 });
    expect(r.chart[2]).toEqual({ label: "3", value: 7 });
  });
  it("記録の無い日は 0", () => {
    expect(r.chart[1].value).toBe(0);
  });
  it("合計・記録日数・最高値", () => {
    expect(r.total).toBe(22);
    expect(r.activeUnits).toBe(2);
    expect(r.best).toBe(15);
  });
});

describe("aggregate - monthly（1年・月別）", () => {
  const logs = [
    log("2026-01-15", 3),
    log("2026-01-20", 4),
    log("2026-05-01", 9),
  ];
  const r = aggregate(logs, "monthly", 2026, 1);

  it("チャート長は12", () => {
    expect(r.chart).toHaveLength(12);
  });
  it("同一月は合算される", () => {
    expect(r.chart[0]).toEqual({ label: "1", value: 7 });
    expect(r.chart[4]).toEqual({ label: "5", value: 9 });
  });
  it("合計・記録月数・最高値", () => {
    expect(r.total).toBe(16);
    expect(r.activeUnits).toBe(2);
    expect(r.best).toBe(9);
  });
});

describe("aggregate - 空", () => {
  const r = aggregate([], "daily", 2026, 7);
  it("全て 0 になる", () => {
    expect(r.total).toBe(0);
    expect(r.activeUnits).toBe(0);
    expect(r.best).toBe(0);
    expect(r.chart.every((d) => d.value === 0)).toBe(true);
  });
});

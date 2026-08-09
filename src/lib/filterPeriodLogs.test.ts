import { describe, it, expect } from "vitest";
import { filterPeriodLogs } from "./aggregate";
import type { CountLog } from "@/types/db";

function log(id: string, counter_id: string, logged_on: string): CountLog {
  return { id, counter_id, user_id: "u1", count: 1, logged_on, created_at: "" };
}

const logs = [
  log("a", "c1", "2026-07-01"),
  log("b", "c1", "2026-07-31"),
  log("c", "c1", "2026-08-01"),
  log("d", "c1", "2025-07-15"),
  log("e", "c2", "2026-07-10"), // 別カウンター
];

describe("filterPeriodLogs - daily（年月一致 + カウンター一致）", () => {
  const r = filterPeriodLogs(logs, "c1", "daily", 2026, 7);
  it("対象カウンターの当月のみ抽出する", () => {
    expect(r.map((l) => l.id).sort()).toEqual(["a", "b"]);
  });
  it("1桁月はゼロ埋めして一致する", () => {
    const feb = filterPeriodLogs(
      [log("x", "c1", "2026-02-05"), log("y", "c1", "2026-12-05")],
      "c1",
      "daily",
      2026,
      2,
    );
    expect(feb.map((l) => l.id)).toEqual(["x"]);
  });
});

describe("filterPeriodLogs - monthly（年一致 + カウンター一致）", () => {
  const r = filterPeriodLogs(logs, "c1", "monthly", 2026, 1);
  it("対象カウンターの当年のみ抽出する（月は無視）", () => {
    expect(r.map((l) => l.id).sort()).toEqual(["a", "b", "c"]);
  });
});

describe("filterPeriodLogs - 別カウンターは除外", () => {
  it("c2 のログは c1 の抽出に含まれない", () => {
    const r = filterPeriodLogs(logs, "c1", "daily", 2026, 7);
    expect(r.some((l) => l.counter_id === "c2")).toBe(false);
  });
});

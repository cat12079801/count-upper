import { describe, it, expect } from "vitest";
import { diffSnapshot } from "./store";
import type { Counter, CountLog } from "@/types/db";

function counter(id: string, name = "腹筋", daily_goal: number | null = null): Counter {
  return { id, user_id: "u1", name, unit: "回", daily_goal, created_at: "2026-01-01" };
}
function log(id: string, count: number, logged_on = "2026-07-01"): CountLog {
  return { id, counter_id: "c1", user_id: "u1", count, logged_on, created_at: "" };
}

describe("diffSnapshot", () => {
  const base = { counters: [counter("c1")], logs: [log("l1", 10)] };

  it("同一内容は差分なし（false）", () => {
    const same = { counters: [counter("c1")], logs: [log("l1", 10)] };
    expect(diffSnapshot(base, same)).toBe(false);
  });

  it("順序が違っても内容が同じなら差分なし", () => {
    const reordered = {
      counters: [counter("c2"), counter("c1")],
      logs: [log("l2", 5), log("l1", 10)],
    };
    const withC2 = {
      counters: [counter("c1"), counter("c2")],
      logs: [log("l1", 10), log("l2", 5)],
    };
    expect(diffSnapshot(reordered, withC2)).toBe(false);
  });

  it("ログの count 変化を検出する（true）", () => {
    const changed = { counters: [counter("c1")], logs: [log("l1", 11)] };
    expect(diffSnapshot(base, changed)).toBe(true);
  });

  it("ログの追加を検出する（true）", () => {
    const added = { counters: [counter("c1")], logs: [log("l1", 10), log("l2", 3)] };
    expect(diffSnapshot(base, added)).toBe(true);
  });

  it("カウンター名の変更を検出する（true）", () => {
    const renamed = { counters: [counter("c1", "腕立て")], logs: [log("l1", 10)] };
    expect(diffSnapshot(base, renamed)).toBe(true);
  });

  it("日次目標の変更を検出する（true）", () => {
    const goal = { counters: [counter("c1", "腹筋", 50)], logs: [log("l1", 10)] };
    expect(diffSnapshot(base, goal)).toBe(true);
  });
});

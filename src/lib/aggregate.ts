import type { CountLog } from "@/types/db";
import { monthRange } from "@/lib/date";

export type ViewMode = "daily" | "monthly";
export type ChartDatum = { label: string; value: number };

export type Aggregation = {
  chart: ChartDatum[];
  total: number;
  activeUnits: number;
  best: number;
};

// ログ配列を日別（1か月）または月別（1年）に集計する。サーバ/クライアント共通。
export function aggregate(
  logs: CountLog[],
  view: ViewMode,
  year: number,
  month: number,
): Aggregation {
  const buckets = new Map<number, number>();
  for (const log of logs) {
    // logged_on: YYYY-MM-DD
    const [, mm, dd] = log.logged_on.split("-").map(Number);
    const key = view === "daily" ? dd : mm;
    buckets.set(key, (buckets.get(key) ?? 0) + log.count);
  }

  const chart: ChartDatum[] = [];
  const size = view === "daily" ? monthRange(year, month).days : 12;
  for (let i = 1; i <= size; i++) {
    chart.push({ label: String(i), value: buckets.get(i) ?? 0 });
  }

  const total = [...buckets.values()].reduce((a, b) => a + b, 0);
  const activeUnits = [...buckets.values()].filter((v) => v > 0).length;
  const best = chart.reduce((m, d) => Math.max(m, d.value), 0);

  return { chart, total, activeUnits, best };
}

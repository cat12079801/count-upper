import { createClient } from "@/lib/supabase/server";
import type { Counter, CountLog } from "@/types/db";
import { monthRange, yearRange } from "@/lib/date";
import { CounterBar } from "@/components/CounterBar";
import { EmptyState } from "@/components/EmptyState";
import { RecordPanel } from "@/components/RecordPanel";
import { StatsChart, type ChartDatum } from "@/components/StatsChart";

type ViewMode = "daily" | "monthly";

type SearchParams = {
  c?: string;
  view?: string;
  y?: string;
  m?: string;
};

export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();

  const { data: countersData } = await supabase
    .from("counters")
    .select("*")
    .order("created_at", { ascending: true });
  const counters = (countersData ?? []) as Counter[];

  if (counters.length === 0) {
    return <EmptyState />;
  }

  // 選択中カウンター
  const selected =
    counters.find((c) => c.id === sp.c) ?? counters[0];

  const view: ViewMode = sp.view === "monthly" ? "monthly" : "daily";
  const now = new Date();
  const year = clampInt(sp.y, now.getFullYear(), 2000, 2100);
  const month = clampInt(sp.m, now.getMonth() + 1, 1, 12);

  // 期間内のログ取得
  const range =
    view === "daily" ? monthRange(year, month) : yearRange(year);
  const { data: logsData } = await supabase
    .from("count_logs")
    .select("*")
    .eq("counter_id", selected.id)
    .gte("logged_on", range.start)
    .lte("logged_on", range.end)
    .order("logged_on", { ascending: false });
  const logs = (logsData ?? []) as CountLog[];

  // 集計
  const { chart, total, activeUnits, best } = aggregate(
    logs,
    view,
    year,
    month,
  );

  return (
    <div className="flex flex-col gap-8">
      <CounterBar
        counters={counters}
        selectedId={selected.id}
        view={view}
        year={year}
        month={month}
      />

      <StatsChart
        view={view}
        year={year}
        month={month}
        unit={selected.unit}
        data={chart}
        total={total}
        activeUnits={activeUnits}
        best={best}
        selectedId={selected.id}
      />

      <RecordPanel counter={selected} logs={logs.slice(0, 30)} />
    </div>
  );
}

function clampInt(
  v: string | undefined,
  fallback: number,
  min: number,
  max: number,
): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}

function aggregate(
  logs: CountLog[],
  view: ViewMode,
  year: number,
  month: number,
): {
  chart: ChartDatum[];
  total: number;
  activeUnits: number;
  best: number;
} {
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

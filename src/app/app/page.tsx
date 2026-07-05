import { createClient } from "@/lib/supabase/server";
import type { Counter, CountLog } from "@/types/db";
import { monthRange, yearRange } from "@/lib/date";
import type { ViewMode } from "@/lib/aggregate";
import { CounterBar } from "@/components/CounterBar";
import { EmptyState } from "@/components/EmptyState";
import { Dashboard } from "@/components/Dashboard";

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
  const selected = counters.find((c) => c.id === sp.c) ?? counters[0];

  const view: ViewMode = sp.view === "monthly" ? "monthly" : "daily";
  const now = new Date();
  const year = clampInt(sp.y, now.getFullYear(), 2000, 2100);
  const month = clampInt(sp.m, now.getMonth() + 1, 1, 12);

  // 期間内のログ取得
  const range = view === "daily" ? monthRange(year, month) : yearRange(year);
  const { data: logsData } = await supabase
    .from("count_logs")
    .select("*")
    .eq("counter_id", selected.id)
    .gte("logged_on", range.start)
    .lte("logged_on", range.end)
    .order("logged_on", { ascending: false });
  const logs = (logsData ?? []) as CountLog[];

  return (
    <div className="flex flex-col gap-8">
      <CounterBar
        counters={counters}
        selectedId={selected.id}
        view={view}
        year={year}
        month={month}
      />

      <Dashboard
        counter={selected}
        view={view}
        year={year}
        month={month}
        logs={logs}
      />
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

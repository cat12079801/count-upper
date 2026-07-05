"use client";

import { useOptimistic } from "react";
import type { Counter, CountLog } from "@/types/db";
import { aggregate, type ViewMode } from "@/lib/aggregate";
import { addLog, deleteLog } from "@/app/app/actions";
import { StatsChart } from "./StatsChart";
import { RecordPanel } from "./RecordPanel";
import { useToast } from "./Toast";

type OptimisticAction =
  | { type: "add"; log: CountLog }
  | { type: "delete"; id: string };

let tmpSeq = 0;

export function Dashboard({
  counter,
  view,
  year,
  month,
  logs,
}: {
  counter: Counter;
  view: ViewMode;
  year: number;
  month: number;
  logs: CountLog[];
}) {
  const { show } = useToast();
  const [optimisticLogs, applyOptimistic] = useOptimistic(
    logs,
    (state: CountLog[], action: OptimisticAction) => {
      if (action.type === "add") return [action.log, ...state];
      return state.filter((l) => l.id !== action.id);
    },
  );

  const agg = aggregate(optimisticLogs, view, year, month);

  // 追加: 通信完了を待たず即時反映する
  async function handleAdd(formData: FormData) {
    const count = Math.floor(Number(formData.get("count") ?? 0));
    const loggedOn = String(formData.get("logged_on") ?? "");
    if (Number.isFinite(count) && count > 0 && loggedOn) {
      applyOptimistic({
        type: "add",
        log: {
          id: `tmp-${tmpSeq++}`,
          counter_id: counter.id,
          user_id: "",
          count,
          logged_on: loggedOn,
          created_at: "",
        },
      });
    }
    const res = await addLog(null, formData);
    if (res.ok) show("記録した");
    else show(res.error, "error");
  }

  // 削除: リストから即時除去する
  async function handleDelete(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    if (id) applyOptimistic({ type: "delete", id });
    const res = await deleteLog(null, formData);
    if (res.ok) show("削除した");
    else show(res.error, "error");
  }

  return (
    <>
      <StatsChart
        view={view}
        year={year}
        month={month}
        unit={counter.unit}
        data={agg.chart}
        total={agg.total}
        activeUnits={agg.activeUnits}
        best={agg.best}
        selectedId={counter.id}
      />
      <RecordPanel
        counter={counter}
        logs={optimisticLogs.slice(0, 30)}
        onAdd={handleAdd}
        onDelete={handleDelete}
      />
    </>
  );
}

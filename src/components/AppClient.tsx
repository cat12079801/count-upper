"use client";

import { useEffect, useMemo, useState } from "react";
import { useAppData, type CounterInput } from "@/lib/useAppData";
import { aggregate, filterPeriodLogs, type ViewMode } from "@/lib/aggregate";
import { useToast } from "./Toast";
import { useRegisterRefresh } from "./RefreshContext";
import { CounterBar } from "./CounterBar";
import { StatsChart } from "./StatsChart";
import { RecordPanel } from "./RecordPanel";
import { EmptyState } from "./EmptyState";

function clampInt(v: string | undefined, fallback: number, min: number, max: number): number {
  const n = Number(v);
  if (!Number.isInteger(n) || n < min || n > max) return fallback;
  return n;
}

export function AppClient({
  userId,
  initialCounterId,
  initialView,
  initialYear,
  initialMonth,
}: {
  userId: string;
  initialCounterId?: string;
  initialView?: string;
  initialYear?: string;
  initialMonth?: string;
}) {
  const { show } = useToast();
  const {
    counters,
    logs,
    ready,
    refresh,
    addLog,
    removeLog,
    addCounter,
    updateCounter,
    removeCounter,
  } = useAppData(userId);

  // プルリフレッシュ（layout の PullToRefresh）から裏取得を発火できるよう登録する。
  useRegisterRefresh(refresh);

  // 表示状態はすべてクライアント state。初期値は URL、無ければローカル現在年月。
  // ローカル基準で決めることで TZ 差（サーバ UTC）による初期月ズレを防ぐ（旧 TodaySync の役割）。
  const now = new Date();
  const [view, setView] = useState<ViewMode>(initialView === "monthly" ? "monthly" : "daily");
  const [year, setYear] = useState(() => clampInt(initialYear, now.getFullYear(), 2000, 2100));
  const [month, setMonth] = useState(() => clampInt(initialMonth, now.getMonth() + 1, 1, 12));
  const [selectedId, setSelectedId] = useState<string | undefined>(initialCounterId);

  const selected = counters.find((c) => c.id === selectedId) ?? counters[0];

  // URL をディープリンク用に同期する（RSC ナビゲーションを起こさない）。
  const selectedIdResolved = selected?.id;
  useEffect(() => {
    if (!selectedIdResolved) return;
    const q = new URLSearchParams({
      c: selectedIdResolved,
      view,
      y: String(year),
      m: String(month),
    });
    window.history.replaceState(null, "", `/app?${q.toString()}`);
  }, [selectedIdResolved, view, year, month]);

  // 選択期間のログを絞り込む（全ログをキャッシュしているため集計前に必須）。
  const periodLogs = useMemo(
    () => (selected ? filterPeriodLogs(logs, selected.id, view, year, month) : []),
    [logs, selected, view, year, month],
  );

  const agg = useMemo(
    () => aggregate(periodLogs, view, year, month),
    [periodLogs, view, year, month],
  );

  const recent = useMemo(
    () =>
      [...periodLogs]
        .sort((a, b) =>
          a.logged_on < b.logged_on
            ? 1
            : a.logged_on > b.logged_on
              ? -1
              : a.created_at < b.created_at
                ? 1
                : -1,
        )
        .slice(0, 30),
    [periodLogs],
  );

  function shiftPeriod(delta: number) {
    if (view === "daily") {
      let m = month + delta;
      let y = year;
      if (m < 1) {
        m = 12;
        y -= 1;
      } else if (m > 12) {
        m = 1;
        y += 1;
      }
      setYear(y);
      setMonth(m);
    } else {
      setYear(year + delta);
    }
  }

  // 記録の追加/削除（楽観反映は useAppData 側で即時に行われる）。
  async function handleAdd(formData: FormData) {
    if (!selected) return;
    const count = Math.floor(Number(formData.get("count") ?? 0));
    const loggedOn = String(formData.get("logged_on") ?? "");
    const res = await addLog({ counterId: selected.id, count, loggedOn });
    if (res.ok) show("記録した");
    else show(res.error, "error");
  }

  async function handleDelete(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    const res = await removeLog(id);
    if (res.ok) show("削除した");
    else show(res.error, "error");
  }

  // カウンター CRUD。成功可否を返し、CounterBar 側のパネル開閉に使う。
  async function handleCreateCounter(input: CounterInput) {
    const res = await addCounter(input);
    if (res.ok) {
      show("カウンターを追加した");
      setSelectedId(res.counter.id);
    } else show(res.error, "error");
    return res;
  }

  async function handleUpdateCounter(input: CounterInput & { id: string }) {
    const res = await updateCounter(input);
    if (res.ok) show("保存した");
    else show(res.error, "error");
    return res;
  }

  async function handleRemoveCounter(id: string) {
    const res = await removeCounter(id);
    if (res.ok) show("削除した");
    else show(res.error, "error");
    return res;
  }

  // 初回訪問（キャッシュ無し）で取得完了前はスケルトンを出す。
  if (!ready) {
    return (
      <div className="flex justify-center py-24">
        <div
          className="h-8 w-8 animate-spin rounded-full border-2 border-neutral-300 border-t-accent"
          role="status"
          aria-label="読み込み中"
        />
      </div>
    );
  }

  if (counters.length === 0) {
    return <EmptyState onCreate={handleCreateCounter} />;
  }

  return (
    <div className="flex flex-col gap-8">
      <CounterBar
        counters={counters}
        selectedId={selected?.id ?? ""}
        onSelect={setSelectedId}
        onCreate={handleCreateCounter}
        onUpdate={handleUpdateCounter}
        onDelete={handleRemoveCounter}
      />

      {selected && (
        <>
          <StatsChart
            view={view}
            year={year}
            month={month}
            unit={selected.unit}
            data={agg.chart}
            total={agg.total}
            activeUnits={agg.activeUnits}
            best={agg.best}
            goal={selected.daily_goal}
            onChangeView={setView}
            onShift={shiftPeriod}
          />
          <RecordPanel
            counter={selected}
            logs={recent}
            onAdd={handleAdd}
            onDelete={handleDelete}
          />
        </>
      )}
    </div>
  );
}

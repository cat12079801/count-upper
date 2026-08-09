"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { loadSnapshot, saveSnapshot, diffSnapshot } from "@/lib/store";
import type { Counter, CountLog } from "@/types/db";
import {
  createCounter,
  renameCounter,
  deleteCounter,
  addLog as addLogAction,
  deleteLog as deleteLogAction,
  type ActionResult,
} from "@/app/app/actions";

// ローカルファーストなデータ層。
// - 初回描画はキャッシュから同期的に行う（サーバ往復なし）。
// - マウント時に裏で全件再取得し、差分があればマージ／再描画する（stale-while-revalidate）。
// - 追加/削除・カウンターCRUD は楽観更新→サーバ確定→返却行で整合する。

type State = { counters: Counter[]; logs: CountLog[]; ready: boolean };

let tmpSeq = 0;
const tmpId = () => `tmp-${tmpSeq++}`;

export type CounterInput = {
  name: string;
  unit: string;
  dailyGoal: number | null;
};

export function useAppData(userId: string) {
  // 初期 state は SSR と一致させるため常に空にする。localStorage の読込は
  // マウント後（下の effect）に行う。ここで cache を読むと client component の
  // SSR（空）とハイドレーション（cache 反映）でツリーが食い違い、hydration mismatch になる。
  const [state, setState] = useState<State>({
    counters: [],
    logs: [],
    ready: false,
  });

  // 楽観更新中の裏取得抑止と、ロールバック用に現在値を参照するための ref。
  // ref の更新は render 中ではなく effect で行う（render 中の書込みは不可）。
  const stateRef = useRef(state);
  useEffect(() => {
    stateRef.current = state;
  }, [state]);
  const mutatingRef = useRef(0);

  // 楽観更新の適用＋永続化。ready は常に true にする。
  const apply = useCallback(
    (updater: (prev: State) => { counters: Counter[]; logs: CountLog[] }) => {
      setState((prev) => {
        const next = updater(prev);
        saveSnapshot(userId, next);
        return { ...next, ready: true };
      });
    },
    [userId],
  );

  // 裏取得：サーバ真実で全置換。差分が無ければ再描画しない。
  // 最初の setState は必ず await の後に行い、mount effect からの同期 setState を避ける。
  const refresh = useCallback(async () => {
    if (mutatingRef.current > 0) return; // 楽観更新中は見送る
    try {
      const supabase = createClient();
      const [countersRes, logsRes] = await Promise.all([
        supabase.from("counters").select("*").order("created_at", { ascending: true }),
        supabase.from("count_logs").select("*").order("logged_on", { ascending: false }),
      ]);
      const fresh = {
        counters: (countersRes.data ?? []) as Counter[],
        logs: (logsRes.data ?? []) as CountLog[],
      };
      setState((prev) => {
        if (prev.ready && !diffSnapshot(prev, fresh)) return prev;
        saveSnapshot(userId, fresh);
        return { ...fresh, ready: true };
      });
    } catch {
      // ネットワーク不通等はキャッシュのまま継続する
      setState((prev) => (prev.ready ? prev : { ...prev, ready: true }));
    }
  }, [userId]);

  useEffect(() => {
    // マウント後にキャッシュを同期読込して即描画（サーバ往復なし）→ 続けて裏取得。
    // いずれも外部ソース（localStorage / DB）との同期であり、この用途に限り
    // set-state-in-effect を許可する。
    const snap = loadSnapshot(userId);
    if (snap) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setState({ counters: snap.counters, logs: snap.logs, ready: true });
    }
    refresh();
  }, [userId, refresh]);

  // mutation を楽観更新付きで実行する共通ラッパ。
  const runMutation = useCallback(
    async <T>(fn: () => Promise<ActionResult<T>>): Promise<ActionResult<T>> => {
      mutatingRef.current += 1;
      try {
        return await fn();
      } finally {
        mutatingRef.current -= 1;
      }
    },
    [],
  );

  const addLog = useCallback(
    (input: { counterId: string; count: number; loggedOn: string }) =>
      runMutation(async () => {
        const temp: CountLog = {
          id: tmpId(),
          counter_id: input.counterId,
          user_id: "",
          count: input.count,
          logged_on: input.loggedOn,
          created_at: new Date().toISOString(),
        };
        apply((prev) => ({ counters: prev.counters, logs: [temp, ...prev.logs] }));
        const res = await addLogAction(input);
        if (res.ok) {
          apply((prev) => ({
            counters: prev.counters,
            logs: prev.logs.map((l) => (l.id === temp.id ? res.log : l)),
          }));
        } else {
          apply((prev) => ({
            counters: prev.counters,
            logs: prev.logs.filter((l) => l.id !== temp.id),
          }));
        }
        return res;
      }),
    [apply, runMutation],
  );

  const removeLog = useCallback(
    (id: string) =>
      runMutation(async () => {
        const target = stateRef.current.logs.find((l) => l.id === id);
        apply((prev) => ({
          counters: prev.counters,
          logs: prev.logs.filter((l) => l.id !== id),
        }));
        const res = await deleteLogAction({ id });
        if (!res.ok && target) {
          apply((prev) => ({
            counters: prev.counters,
            logs: [target, ...prev.logs],
          }));
        }
        return res;
      }),
    [apply, runMutation],
  );

  const addCounter = useCallback(
    (input: CounterInput) =>
      runMutation(async () => {
        // 作成はサーバ採番の id が必要なため楽観挿入せず、確定後に追加する。
        const res = await createCounter(input);
        if (res.ok) {
          apply((prev) => ({
            counters: [...prev.counters, res.counter],
            logs: prev.logs,
          }));
        }
        return res;
      }),
    [apply, runMutation],
  );

  const updateCounter = useCallback(
    (input: CounterInput & { id: string }) =>
      runMutation(async () => {
        const before = stateRef.current.counters.find((c) => c.id === input.id);
        apply((prev) => ({
          counters: prev.counters.map((c) =>
            c.id === input.id
              ? { ...c, name: input.name, unit: input.unit, daily_goal: input.dailyGoal }
              : c,
          ),
          logs: prev.logs,
        }));
        const res = await renameCounter(input);
        if (res.ok) {
          apply((prev) => ({
            counters: prev.counters.map((c) => (c.id === res.counter.id ? res.counter : c)),
            logs: prev.logs,
          }));
        } else if (before) {
          apply((prev) => ({
            counters: prev.counters.map((c) => (c.id === before.id ? before : c)),
            logs: prev.logs,
          }));
        }
        return res;
      }),
    [apply, runMutation],
  );

  const removeCounter = useCallback(
    (id: string) =>
      runMutation(async () => {
        const beforeCounters = stateRef.current.counters;
        const beforeLogs = stateRef.current.logs;
        apply((prev) => ({
          counters: prev.counters.filter((c) => c.id !== id),
          logs: prev.logs.filter((l) => l.counter_id !== id),
        }));
        const res = await deleteCounter({ id });
        if (!res.ok) {
          apply(() => ({ counters: beforeCounters, logs: beforeLogs }));
        }
        return res;
      }),
    [apply, runMutation],
  );

  return {
    counters: state.counters,
    logs: state.logs,
    ready: state.ready,
    refresh,
    addLog,
    removeLog,
    addCounter,
    updateCounter,
    removeCounter,
  };
}

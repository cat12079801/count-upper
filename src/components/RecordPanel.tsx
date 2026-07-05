"use client";

import { useState } from "react";
import type { Counter, CountLog } from "@/types/db";
import { addLog, deleteLog } from "@/app/app/actions";
import { todayStr } from "@/lib/date";

export function RecordPanel({
  counter,
  logs,
}: {
  counter: Counter;
  logs: CountLog[];
}) {
  const [date, setDate] = useState(todayStr());
  const [amount, setAmount] = useState(1);

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-bold text-neutral-500">記録する</h2>

      <form
        action={addLog}
        className="flex flex-wrap items-end gap-3 rounded-2xl bg-white p-4 ring-1 ring-neutral-200"
      >
        <input type="hidden" name="counter_id" value={counter.id} />

        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
          日付
          <input
            type="date"
            name="logged_on"
            value={date}
            max={todayStr()}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
          {counter.unit}数
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAmount((a) => Math.max(1, a - 1))}
              className="h-9 w-9 rounded-lg text-lg font-bold text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-100"
            >
              −
            </button>
            <input
              type="number"
              name="count"
              min={1}
              inputMode="numeric"
              pattern="[0-9]*"
              value={amount}
              onChange={(e) =>
                setAmount(Math.max(1, Math.floor(Number(e.target.value) || 1)))
              }
              className="w-20 rounded-lg border border-neutral-300 px-2 py-1.5 text-center text-sm outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setAmount((a) => a + 1)}
              className="h-9 w-9 rounded-lg text-lg font-bold text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-100"
            >
              ＋
            </button>
          </div>
        </label>

        <button className="rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-95">
          ＋{amount} 記録
        </button>
      </form>

      {logs.length > 0 && (
        <div className="flex flex-col gap-1">
          <h3 className="text-xs font-medium text-neutral-400">最近の記録</h3>
          <ul className="divide-y divide-neutral-100 rounded-2xl bg-white ring-1 ring-neutral-200">
            {logs.map((log) => (
              <li
                key={log.id}
                className="flex items-center justify-between px-4 py-2.5 text-sm"
              >
                <span className="text-neutral-500">{log.logged_on}</span>
                <span className="font-semibold">
                  {log.count}
                  {counter.unit}
                </span>
                <form action={deleteLog}>
                  <input type="hidden" name="id" value={log.id} />
                  <button className="text-xs text-neutral-400 hover:text-red-600">
                    削除
                  </button>
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

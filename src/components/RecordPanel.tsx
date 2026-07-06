"use client";

import { useState } from "react";
import type { Counter, CountLog } from "@/types/db";
import { todayStr } from "@/lib/date";
import { SubmitButton } from "./SubmitButton";

export function RecordPanel({
  counter,
  logs,
  onAdd,
  onDelete,
}: {
  counter: Counter;
  logs: CountLog[];
  onAdd: (formData: FormData) => void | Promise<void>;
  onDelete: (formData: FormData) => void | Promise<void>;
}) {
  const [date, setDate] = useState(todayStr());
  // 空を既定にし、プレースホルダで 1 を示す。空のままは記録不可（required）。
  const [amount, setAmount] = useState("");
  const parsed = amount === "" ? 0 : Math.max(1, Math.floor(Number(amount)));

  async function handleAdd(formData: FormData) {
    await onAdd(formData);
    setAmount("");
  }

  return (
    <section className="flex flex-col gap-4">
      <h2 className="text-sm font-bold text-neutral-500">記録する</h2>

      <form
        action={handleAdd}
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
            className="rounded-lg border border-neutral-300 px-2 py-1.5 outline-none focus:border-accent"
          />
        </label>

        <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
          {counter.unit}数
          <div className="flex items-center gap-1">
            <button
              type="button"
              onClick={() => setAmount(String(Math.max(1, parsed - 1)))}
              className="h-9 w-9 rounded-lg text-lg font-bold text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-100"
            >
              −
            </button>
            <input
              type="number"
              name="count"
              required
              min={1}
              max={100000}
              inputMode="numeric"
              pattern="[0-9]*"
              placeholder="1"
              value={amount}
              onChange={(e) => {
                const v = e.target.value;
                if (v === "") return setAmount("");
                const n = Math.floor(Number(v));
                if (!Number.isFinite(n)) return;
                setAmount(String(Math.min(100000, Math.max(1, n))));
              }}
              className="w-20 rounded-lg border border-neutral-300 px-2 py-1.5 text-center outline-none focus:border-accent"
            />
            <button
              type="button"
              onClick={() => setAmount(String(Math.min(100000, parsed + 1)))}
              className="h-9 w-9 rounded-lg text-lg font-bold text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-100"
            >
              ＋
            </button>
          </div>
        </label>

        <SubmitButton
          idle={amount === "" ? "記録" : `＋${parsed} 記録`}
          pending="記録中…"
          className="rounded-full bg-accent px-6 py-2.5 text-sm font-bold text-white shadow-sm hover:brightness-95 disabled:opacity-60"
        />
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
                <form action={onDelete}>
                  <input type="hidden" name="id" value={log.id} />
                  <SubmitButton
                    idle="削除"
                    pending="…"
                    className="text-xs text-neutral-400 hover:text-red-600 disabled:opacity-60"
                  />
                </form>
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  );
}

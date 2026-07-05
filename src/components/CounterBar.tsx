"use client";

import { useState } from "react";
import Link from "next/link";
import type { Counter } from "@/types/db";
import { createCounter, renameCounter, deleteCounter } from "@/app/app/actions";

export function CounterBar({
  counters,
  selectedId,
  view,
  year,
  month,
}: {
  counters: Counter[];
  selectedId: string;
  view: "daily" | "monthly";
  year: number;
  month: number;
}) {
  const [mode, setMode] = useState<null | "add" | "edit">(null);
  const selected = counters.find((c) => c.id === selectedId);

  function hrefFor(id: string) {
    const q = new URLSearchParams({
      c: id,
      view,
      y: String(year),
      m: String(month),
    });
    return `/app?${q.toString()}`;
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {counters.map((c) => {
          const active = c.id === selectedId;
          return (
            <Link
              key={c.id}
              href={hrefFor(c.id)}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-100"
              }`}
            >
              {c.name}
            </Link>
          );
        })}
        <button
          onClick={() => setMode(mode === "add" ? null : "add")}
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-100"
          aria-label="カウンターを追加"
        >
          ＋
        </button>
        {selected && (
          <button
            onClick={() => setMode(mode === "edit" ? null : "edit")}
            className="text-xs font-medium text-neutral-400 hover:text-neutral-700"
          >
            編集
          </button>
        )}
      </div>

      {mode === "add" && (
        <form
          action={createCounter}
          onSubmit={() => setMode(null)}
          className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 ring-1 ring-neutral-200"
        >
          <Field label="名称">
            <input
              name="name"
              required
              maxLength={50}
              placeholder="腹筋"
              className="w-32 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-accent"
            />
          </Field>
          <Field label="単位">
            <input
              name="unit"
              defaultValue="回"
              maxLength={10}
              className="w-20 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-accent"
            />
          </Field>
          <button className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white">
            追加
          </button>
        </form>
      )}

      {mode === "edit" && selected && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 ring-1 ring-neutral-200">
          <form
            action={renameCounter}
            onSubmit={() => setMode(null)}
            className="flex flex-wrap items-end gap-2"
          >
            <input type="hidden" name="id" value={selected.id} />
            <Field label="名称">
              <input
                name="name"
                required
                maxLength={50}
                defaultValue={selected.name}
                className="w-32 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-accent"
              />
            </Field>
            <Field label="単位">
              <input
                name="unit"
                defaultValue={selected.unit}
                maxLength={10}
                className="w-20 rounded-lg border border-neutral-300 px-2 py-1.5 text-sm outline-none focus:border-accent"
              />
            </Field>
            <button className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white">
              保存
            </button>
          </form>
          <form
            action={deleteCounter}
            onSubmit={(e) => {
              if (!confirm(`「${selected.name}」と記録をすべて削除する。よい？`)) {
                e.preventDefault();
                return;
              }
              setMode(null);
            }}
          >
            <input type="hidden" name="id" value={selected.id} />
            <button className="rounded-full px-4 py-1.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50">
              削除
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="flex flex-col gap-1 text-xs font-medium text-neutral-500">
      {label}
      {children}
    </label>
  );
}

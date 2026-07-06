"use client";

import { useState } from "react";
import Link from "next/link";
import type { Counter } from "@/types/db";
import { createCounter, renameCounter, deleteCounter } from "@/app/app/actions";
import { useFormAction } from "./useFormAction";

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

  const close = () => setMode(null);
  const add = useFormAction(createCounter, {
    successMessage: "カウンターを追加した",
    onSuccess: close,
  });
  const rename = useFormAction(renameCounter, {
    successMessage: "保存した",
    onSuccess: close,
  });
  const remove = useFormAction(deleteCounter, {
    successMessage: "削除した",
    onSuccess: close,
  });

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
          action={add.formAction}
          className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 ring-1 ring-neutral-200"
        >
          <Field label="名称">
            <input
              name="name"
              required
              maxLength={50}
              placeholder="腹筋"
              className="w-32 rounded-lg border border-neutral-300 px-2 py-1.5 outline-none focus:border-accent"
            />
          </Field>
          <Field label="単位">
            <input
              name="unit"
              defaultValue="回"
              maxLength={10}
              className="w-20 rounded-lg border border-neutral-300 px-2 py-1.5 outline-none focus:border-accent"
            />
          </Field>
          <Field label="日次目標(任意)">
            <input
              name="daily_goal"
              type="number"
              min={1}
              max={100000}
              inputMode="numeric"
              placeholder="—"
              className="w-24 rounded-lg border border-neutral-300 px-2 py-1.5 outline-none focus:border-accent"
            />
          </Field>
          <button
            disabled={add.pending}
            className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          >
            {add.pending ? "追加中…" : "追加"}
          </button>
          <button
            type="button"
            onClick={close}
            disabled={add.pending}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-100 disabled:opacity-60"
          >
            キャンセル
          </button>
        </form>
      )}

      {mode === "edit" && selected && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 ring-1 ring-neutral-200">
          <form
            action={rename.formAction}
            className="flex flex-wrap items-end gap-2"
          >
            <input type="hidden" name="id" value={selected.id} />
            <Field label="名称">
              <input
                name="name"
                required
                maxLength={50}
                defaultValue={selected.name}
                className="w-32 rounded-lg border border-neutral-300 px-2 py-1.5 outline-none focus:border-accent"
              />
            </Field>
            <Field label="単位">
              <input
                name="unit"
                defaultValue={selected.unit}
                maxLength={10}
                className="w-20 rounded-lg border border-neutral-300 px-2 py-1.5 outline-none focus:border-accent"
              />
            </Field>
            <Field label="日次目標(任意)">
              <input
                name="daily_goal"
                type="number"
                min={1}
                max={100000}
                inputMode="numeric"
                placeholder="—"
                defaultValue={selected.daily_goal ?? ""}
                className="w-24 rounded-lg border border-neutral-300 px-2 py-1.5 outline-none focus:border-accent"
              />
            </Field>
            <button
              disabled={rename.pending}
              className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
            >
              {rename.pending ? "保存中…" : "保存"}
            </button>
            <button
              type="button"
              onClick={close}
              disabled={rename.pending}
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-100 disabled:opacity-60"
            >
              キャンセル
            </button>
          </form>
          <form
            action={remove.formAction}
            onSubmit={(e) => {
              if (
                !confirm(`「${selected.name}」と記録をすべて削除する。よい？`)
              ) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={selected.id} />
            <button
              disabled={remove.pending}
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
            >
              {remove.pending ? "削除中…" : "削除"}
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

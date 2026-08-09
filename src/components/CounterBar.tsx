"use client";

import { useState } from "react";
import type { Counter } from "@/types/db";
import type { CounterInput } from "@/lib/useAppData";
import { SubmitButton } from "./SubmitButton";

type Result = { ok: boolean };

// 日次目標の入力（空文字）を number|null に変換する。範囲検証はサーバで行う。
function parseGoal(raw: FormDataEntryValue | null): number | null {
  const s = String(raw ?? "").trim();
  if (s === "") return null;
  const n = Math.floor(Number(s));
  return Number.isFinite(n) ? n : null;
}

export function CounterBar({
  counters,
  selectedId,
  onSelect,
  onCreate,
  onUpdate,
  onDelete,
}: {
  counters: Counter[];
  selectedId: string;
  onSelect: (id: string) => void;
  onCreate: (input: CounterInput) => Promise<Result>;
  onUpdate: (input: CounterInput & { id: string }) => Promise<Result>;
  onDelete: (id: string) => Promise<Result>;
}) {
  const [mode, setMode] = useState<null | "add" | "edit">(null);
  const selected = counters.find((c) => c.id === selectedId);
  const close = () => setMode(null);

  async function handleAdd(formData: FormData) {
    const res = await onCreate({
      name: String(formData.get("name") ?? ""),
      unit: String(formData.get("unit") ?? "回"),
      dailyGoal: parseGoal(formData.get("daily_goal")),
    });
    if (res.ok) close();
  }

  async function handleRename(formData: FormData) {
    if (!selected) return;
    const res = await onUpdate({
      id: selected.id,
      name: String(formData.get("name") ?? ""),
      unit: String(formData.get("unit") ?? "回"),
      dailyGoal: parseGoal(formData.get("daily_goal")),
    });
    if (res.ok) close();
  }

  async function handleDelete(formData: FormData) {
    const id = String(formData.get("id") ?? "");
    if (!id) return;
    const res = await onDelete(id);
    if (res.ok) close();
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-2">
        {counters.map((c) => {
          const active = c.id === selectedId;
          return (
            <button
              key={c.id}
              type="button"
              onClick={() => onSelect(c.id)}
              aria-pressed={active}
              className={`rounded-full px-4 py-1.5 text-sm font-semibold transition ${
                active
                  ? "bg-neutral-900 text-white"
                  : "bg-white text-neutral-600 ring-1 ring-neutral-200 hover:bg-neutral-100"
              }`}
            >
              {c.name}
            </button>
          );
        })}
        <button
          type="button"
          onClick={() => setMode(mode === "add" ? null : "add")}
          className="rounded-full px-3 py-1.5 text-sm font-semibold text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-100"
          aria-label="カウンターを追加"
        >
          ＋
        </button>
        {selected && (
          <button
            type="button"
            onClick={() => setMode(mode === "edit" ? null : "edit")}
            className="text-xs font-medium text-neutral-400 hover:text-neutral-700"
          >
            編集
          </button>
        )}
      </div>

      {mode === "add" && (
        <form
          action={handleAdd}
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
          <SubmitButton
            idle="追加"
            pending="追加中…"
            className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
          />
          <button
            type="button"
            onClick={close}
            className="rounded-full px-4 py-1.5 text-sm font-semibold text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-100 disabled:opacity-60"
          >
            キャンセル
          </button>
        </form>
      )}

      {mode === "edit" && selected && (
        <div className="flex flex-wrap items-end gap-2 rounded-xl bg-white p-3 ring-1 ring-neutral-200">
          <form action={handleRename} className="flex flex-wrap items-end gap-2">
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
            <SubmitButton
              idle="保存"
              pending="保存中…"
              className="rounded-full bg-neutral-900 px-4 py-1.5 text-sm font-semibold text-white disabled:opacity-60"
            />
            <button
              type="button"
              onClick={close}
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-neutral-500 ring-1 ring-neutral-200 hover:bg-neutral-100 disabled:opacity-60"
            >
              キャンセル
            </button>
          </form>
          <form
            action={handleDelete}
            onSubmit={(e) => {
              if (!confirm(`「${selected.name}」と記録をすべて削除する。よい？`)) {
                e.preventDefault();
              }
            }}
          >
            <input type="hidden" name="id" value={selected.id} />
            <SubmitButton
              idle="削除"
              pending="削除中…"
              className="rounded-full px-4 py-1.5 text-sm font-semibold text-red-600 ring-1 ring-red-200 hover:bg-red-50 disabled:opacity-60"
            />
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

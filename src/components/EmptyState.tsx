"use client";

import type { CounterInput } from "@/lib/useAppData";
import { SubmitButton } from "./SubmitButton";

export function EmptyState({
  onCreate,
}: {
  onCreate: (input: CounterInput) => Promise<{ ok: boolean }>;
}) {
  async function handleCreate(formData: FormData) {
    await onCreate({
      name: String(formData.get("name") ?? ""),
      unit: String(formData.get("unit") ?? "回"),
      dailyGoal: null,
    });
  }

  return (
    <div className="mx-auto mt-10 max-w-sm text-center">
      <h2 className="text-xl font-bold">最初のカウンターを作る</h2>
      <p className="mt-2 text-sm text-neutral-500">
        腕立て伏せ、腹筋、読書ページ数など、数えたい対象を登録する。
      </p>
      <form action={handleCreate} className="mt-6 flex flex-col gap-3 text-left">
        <label className="text-xs font-medium text-neutral-500">
          名称
          <input
            name="name"
            required
            maxLength={50}
            placeholder="腕立て伏せ"
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 outline-none focus:border-accent"
          />
        </label>
        <label className="text-xs font-medium text-neutral-500">
          単位
          <input
            name="unit"
            defaultValue="回"
            maxLength={10}
            className="mt-1 w-full rounded-lg border border-neutral-300 px-3 py-2 text-neutral-900 outline-none focus:border-accent"
          />
        </label>
        <SubmitButton
          idle="作成"
          pending="作成中…"
          className="mt-2 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700 disabled:opacity-60"
        />
      </form>
    </div>
  );
}

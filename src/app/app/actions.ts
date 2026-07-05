"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { todayStr } from "@/lib/date";

// 入力の上限（サーバ側で強制する。UI 制約はバイパス可能なため）
const MAX_COUNT = 100_000;
const MAX_NAME_LEN = 50;
const MAX_UNIT_LEN = 10;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("認証が必要");
  return { supabase, user };
}

// YYYY-MM-DD 形式かつ実在する日付で、未来日でないこと（ローカル基準）
function isValidPastDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return false;
  }
  return s <= todayStr();
}

export async function createCounter(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "回").trim() || "回";
  if (!name || name.length > MAX_NAME_LEN || unit.length > MAX_UNIT_LEN) return;

  const { supabase, user } = await requireUser();
  await supabase.from("counters").insert({ user_id: user.id, name, unit });
  revalidatePath("/app");
}

export async function renameCounter(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "回").trim() || "回";
  if (!id || !name || name.length > MAX_NAME_LEN || unit.length > MAX_UNIT_LEN) {
    return;
  }

  const { supabase } = await requireUser();
  await supabase.from("counters").update({ name, unit }).eq("id", id);
  revalidatePath("/app");
}

export async function deleteCounter(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase } = await requireUser();
  await supabase.from("counters").delete().eq("id", id);
  revalidatePath("/app");
}

// カウント記録の追加（指定日に count を加算する1レコード）
export async function addLog(formData: FormData) {
  const counterId = String(formData.get("counter_id") ?? "");
  const count = Math.floor(Number(formData.get("count") ?? 0));
  const loggedOn = String(formData.get("logged_on") ?? "");
  if (
    !counterId ||
    !Number.isFinite(count) ||
    count <= 0 ||
    count > MAX_COUNT ||
    !isValidPastDate(loggedOn)
  ) {
    return;
  }

  const { supabase, user } = await requireUser();

  // counter_id が自分の所有物か確認する（RLS により他人の counter は取得できない）
  const { data: owned } = await supabase
    .from("counters")
    .select("id")
    .eq("id", counterId)
    .maybeSingle();
  if (!owned) return;

  await supabase.from("count_logs").insert({
    counter_id: counterId,
    user_id: user.id,
    count,
    logged_on: loggedOn,
  });
  revalidatePath("/app");
}

export async function deleteLog(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  if (!id) return;

  const { supabase } = await requireUser();
  await supabase.from("count_logs").delete().eq("id", id);
  revalidatePath("/app");
}

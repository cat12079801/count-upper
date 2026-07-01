"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("認証が必要");
  return { supabase, user };
}

export async function createCounter(formData: FormData) {
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "回").trim() || "回";
  if (!name) return;

  const { supabase, user } = await requireUser();
  await supabase.from("counters").insert({ user_id: user.id, name, unit });
  revalidatePath("/app");
}

export async function renameCounter(formData: FormData) {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "回").trim() || "回";
  if (!id || !name) return;

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
  const count = Number(formData.get("count") ?? 0);
  const loggedOn = String(formData.get("logged_on") ?? "");
  if (!counterId || !loggedOn || !Number.isFinite(count) || count <= 0) return;

  const { supabase, user } = await requireUser();
  await supabase.from("count_logs").insert({
    counter_id: counterId,
    user_id: user.id,
    count: Math.floor(count),
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

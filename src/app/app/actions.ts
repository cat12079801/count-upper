"use server";

import { revalidatePath } from "next/cache";
import { createClient } from "@/lib/supabase/server";
import { maxLoggableDateStr } from "@/lib/date";

// サーバアクションの結果型。呼び出し側で成功/失敗を判定する。
export type ActionResult = { ok: true } | { ok: false; error: string };

// 入力の上限（サーバ側で強制する。UI 制約はバイパス可能なため）
const MAX_COUNT = 100_000;
const MAX_NAME_LEN = 50;
const MAX_UNIT_LEN = 10;

async function requireUser() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("認証が必要です。再度ログインしてください。");
  return { supabase, user };
}

// YYYY-MM-DD 形式かつ実在する日付で、過度な未来日でないこと。
// 「今日」の判定はユーザーのローカル TZ に依存するため、サーバでは UTC 翌日までを
// 許容し、いかなる TZ の正当な「今日」も弾かないようにする（TZ 方針: #5）。
function isValidLoggableDate(s: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false;
  const [y, m, d] = s.split("-").map(Number);
  const dt = new Date(y, m - 1, d);
  if (dt.getFullYear() !== y || dt.getMonth() !== m - 1 || dt.getDate() !== d) {
    return false;
  }
  return s <= maxLoggableDateStr();
}

const GENERIC_ERROR = "処理に失敗しました。時間をおいて再度お試しください。";

export async function createCounter(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "回").trim() || "回";
  if (!name) return { ok: false, error: "名称を入力してください。" };
  if (name.length > MAX_NAME_LEN) {
    return { ok: false, error: `名称は${MAX_NAME_LEN}文字以内で入力してください。` };
  }
  if (unit.length > MAX_UNIT_LEN) {
    return { ok: false, error: `単位は${MAX_UNIT_LEN}文字以内で入力してください。` };
  }

  try {
    const { supabase, user } = await requireUser();
    const { error } = await supabase
      .from("counters")
      .insert({ user_id: user.id, name, unit });
    if (error) return { ok: false, error: GENERIC_ERROR };
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : GENERIC_ERROR };
  }
}

export async function renameCounter(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  const name = String(formData.get("name") ?? "").trim();
  const unit = String(formData.get("unit") ?? "回").trim() || "回";
  if (!id) return { ok: false, error: GENERIC_ERROR };
  if (!name) return { ok: false, error: "名称を入力してください。" };
  if (name.length > MAX_NAME_LEN || unit.length > MAX_UNIT_LEN) {
    return { ok: false, error: "名称または単位が長すぎます。" };
  }

  try {
    const { supabase } = await requireUser();
    const { error } = await supabase
      .from("counters")
      .update({ name, unit })
      .eq("id", id);
    if (error) return { ok: false, error: GENERIC_ERROR };
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : GENERIC_ERROR };
  }
}

export async function deleteCounter(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: GENERIC_ERROR };

  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("counters").delete().eq("id", id);
    if (error) return { ok: false, error: GENERIC_ERROR };
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : GENERIC_ERROR };
  }
}

// カウント記録の追加（指定日に count を加算する1レコード）
export async function addLog(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const counterId = String(formData.get("counter_id") ?? "");
  const count = Math.floor(Number(formData.get("count") ?? 0));
  const loggedOn = String(formData.get("logged_on") ?? "");

  if (!counterId) return { ok: false, error: GENERIC_ERROR };
  if (!Number.isFinite(count) || count <= 0) {
    return { ok: false, error: "1以上の回数を入力してください。" };
  }
  if (count > MAX_COUNT) {
    return { ok: false, error: `回数は${MAX_COUNT.toLocaleString()}以下で入力してください。` };
  }
  if (!isValidLoggableDate(loggedOn)) {
    return { ok: false, error: "日付が不正です（未来日は指定できません）。" };
  }

  try {
    const { supabase, user } = await requireUser();

    // counter_id が自分の所有物か確認する（RLS により他人の counter は取得できない）
    const { data: owned } = await supabase
      .from("counters")
      .select("id")
      .eq("id", counterId)
      .maybeSingle();
    if (!owned) return { ok: false, error: "対象のカウンターが見つかりません。" };

    const { error } = await supabase.from("count_logs").insert({
      counter_id: counterId,
      user_id: user.id,
      count,
      logged_on: loggedOn,
    });
    if (error) return { ok: false, error: GENERIC_ERROR };
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : GENERIC_ERROR };
  }
}

export async function deleteLog(
  _prev: ActionResult | null,
  formData: FormData,
): Promise<ActionResult> {
  const id = String(formData.get("id") ?? "");
  if (!id) return { ok: false, error: GENERIC_ERROR };

  try {
    const { supabase } = await requireUser();
    const { error } = await supabase.from("count_logs").delete().eq("id", id);
    if (error) return { ok: false, error: GENERIC_ERROR };
    revalidatePath("/app");
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : GENERIC_ERROR };
  }
}

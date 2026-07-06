import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// E2E 専用のサインイン経路。実 Google アカウントでの自動ログインは不安定なため、
// テスト時のみメール/パスワードでサインインし、認証済みセッション（Cookie）を確立する（#46）。
//
// 二重ガード: 本番では絶対に動作させない。
// - E2E_TEST_LOGIN === "true"（本番 Vercel には設定しない運用）
// - NODE_ENV !== "production"
// いずれかを満たさなければ 404 を返し、経路自体を存在しないものとして扱う。
export async function GET(request: Request) {
  if (
    process.env.E2E_TEST_LOGIN !== "true" ||
    process.env.NODE_ENV === "production"
  ) {
    return new NextResponse("Not Found", { status: 404 });
  }

  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!email || !password) {
    return new NextResponse(
      "E2E_TEST_EMAIL / E2E_TEST_PASSWORD が未設定です。",
      { status: 500 },
    );
  }

  const { origin } = new URL(request.url);

  // 既存の server client を再利用する。signInWithPassword が成功すると
  // @supabase/ssr の cookie アダプタが sb-* セッション Cookie を正しい形式・
  // チャンク分割で書き込む（自前でエンコードしないため壊れにくい）。
  const supabase = await createClient();
  const { error } = await supabase.auth.signInWithPassword({ email, password });
  if (error) {
    return NextResponse.redirect(`${origin}/login?error=e2e`);
  }

  return NextResponse.redirect(`${origin}/app`);
}

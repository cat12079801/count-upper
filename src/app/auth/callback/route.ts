import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// Google OAuth のリダイレクト先。認可コードをセッションに交換する。
export async function GET(request: Request) {
  const { searchParams, origin } = new URL(request.url);
  const code = searchParams.get("code");
  // オープンリダイレクト防止: 同一オリジン内の相対パスのみ許可する
  const nextParam = searchParams.get("next") ?? "/app";
  const next =
    nextParam.startsWith("/") && !nextParam.startsWith("//")
      ? nextParam
      : "/app";

  if (code) {
    const supabase = await createClient();
    const { error } = await supabase.auth.exchangeCodeForSession(code);
    if (!error) {
      return NextResponse.redirect(`${origin}${next}`);
    }
  }

  return NextResponse.redirect(`${origin}/login?error=auth`);
}

import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { AppClient } from "@/components/AppClient";

type SearchParams = {
  c?: string;
  view?: string;
  y?: string;
  m?: string;
};

// 薄いシェル。データ取得はクライアント（AppClient）がキャッシュ＋裏取得で担うため、
// サーバでは認証ゲートと userId の受け渡しのみ行う（起動時のサーバ往復を最小化する）。
export default async function AppPage({
  searchParams,
}: {
  searchParams: Promise<SearchParams>;
}) {
  const sp = await searchParams;
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <AppClient
      userId={user.id}
      initialCounterId={sp.c}
      initialView={sp.view}
      initialYear={sp.y}
      initialMonth={sp.m}
    />
  );
}

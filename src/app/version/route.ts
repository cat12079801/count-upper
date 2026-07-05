import { NextResponse } from "next/server";

// デプロイ確認用の軽量エンドポイント（公開）。
// 例: curl https://count-upper.vercel.app/version
export function GET() {
  return NextResponse.json(
    {
      sha: process.env.NEXT_PUBLIC_COMMIT_SHA ?? "local",
      buildTime: process.env.NEXT_PUBLIC_BUILD_TIME ?? null,
    },
    { headers: { "Cache-Control": "no-store" } },
  );
}

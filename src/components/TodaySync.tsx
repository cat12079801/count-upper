"use client";

import { useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";

// URL に y/m が無い（＝既定表示）とき、サーバ既定（UTC 実行）とユーザーの
// ローカル現在月がズレていれば、ローカル基準の y/m へ置き換える（TZ 方針: #5）。
export function TodaySync({
  serverYear,
  serverMonth,
}: {
  serverYear: number;
  serverMonth: number;
}) {
  const sp = useSearchParams();
  const router = useRouter();

  useEffect(() => {
    if (sp.has("y") || sp.has("m")) return;
    const now = new Date();
    const y = now.getFullYear();
    const m = now.getMonth() + 1;
    if (y === serverYear && m === serverMonth) return;
    const params = new URLSearchParams(sp.toString());
    params.set("y", String(y));
    params.set("m", String(m));
    router.replace(`/app?${params.toString()}`);
  }, [sp, router, serverYear, serverMonth]);

  return null;
}

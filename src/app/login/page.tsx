"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [loading, setLoading] = useState(false);

  async function signInWithGoogle() {
    setLoading(true);
    const supabase = createClient();
    const siteUrl =
      process.env.NEXT_PUBLIC_SITE_URL ?? window.location.origin;
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${siteUrl}/auth/callback`,
      },
    });
    if (error) {
      setLoading(false);
      alert(`ログインに失敗した: ${error.message}`);
    }
  }

  return (
    <main className="flex flex-1 items-center justify-center px-6">
      <div className="w-full max-w-sm text-center">
        <h1 className="text-4xl font-black tracking-tight">count-upper</h1>
        <p className="mt-3 text-sm text-neutral-500">
          日々の数えたい何かを記録し、可視化する。
        </p>

        <button
          onClick={signInWithGoogle}
          disabled={loading}
          className="mt-10 flex w-full items-center justify-center gap-3 rounded-full border border-neutral-300 bg-white px-6 py-3 text-sm font-semibold shadow-sm transition hover:bg-neutral-50 disabled:opacity-60"
        >
          <GoogleIcon />
          {loading ? "リダイレクト中…" : "Google でログイン"}
        </button>
      </div>
    </main>
  );
}

function GoogleIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 18 18" aria-hidden="true">
      <path
        fill="#4285F4"
        d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"
      />
      <path
        fill="#34A853"
        d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.8.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"
      />
      <path
        fill="#FBBC05"
        d="M3.97 10.72a5.4 5.4 0 0 1 0-3.44V4.95H.96a9 9 0 0 0 0 8.1l3.01-2.33z"
      />
      <path
        fill="#EA4335"
        d="M9 3.58c1.32 0 2.5.45 3.44 1.35l2.58-2.58A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"
      />
    </svg>
  );
}

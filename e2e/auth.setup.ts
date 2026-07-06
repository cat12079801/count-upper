import { mkdir } from "node:fs/promises";
import { dirname } from "node:path";
import { test as setup, expect } from "@playwright/test";
import { createClient } from "@supabase/supabase-js";
import { config as loadEnv } from "dotenv";

loadEnv({ path: ".env.e2e" });

const authFile = "e2e/.auth/user.json";

// テストユーザーを idempotent に用意し（案1）、テスト専用ルートでサインインして
// 認証済みセッションを storageState に保存する（案2）。以降のテストはこれを再利用する。
setup("authenticate", async ({ page }) => {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  const email = process.env.E2E_TEST_EMAIL;
  const password = process.env.E2E_TEST_PASSWORD;
  if (!url || !anonKey || !email || !password) {
    throw new Error(
      "E2E 用の環境変数が未設定。.env.e2e（または CI の env）を確認する。",
    );
  }

  // ローカル Supabase は enable_confirmations=false のため確認メール不要。
  // 既に存在する場合のエラー（User already registered 等）は無視する。
  const supabase = createClient(url, anonKey);
  const { error } = await supabase.auth.signUp({ email, password });
  if (error && !/already registered|already been registered/i.test(error.message)) {
    throw error;
  }

  // 保護付きテスト専用ルートに遷移するとサーバ側でサインインし、SSR の Cookie が焼かれる。
  await page.goto("/auth/test-login");
  await page.waitForURL("**/app");
  // 認証済みの証跡としてログアウトボタンの存在を確認する。
  await expect(page.getByRole("button", { name: "ログアウト" })).toBeVisible();

  await mkdir(dirname(authFile), { recursive: true });
  await page.context().storageState({ path: authFile });
});

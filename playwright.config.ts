import { defineConfig, devices } from "@playwright/test";
import { config as loadEnv } from "dotenv";

// ローカルは .env.e2e から環境変数を読む（CI はジョブの env で注入するため上書きしない）。
loadEnv({ path: ".env.e2e" });

const PORT = 3000;
const baseURL = process.env.NEXT_PUBLIC_SITE_URL ?? `http://localhost:${PORT}`;

// webServer（next dev）へ引き渡す環境変数。
// テスト専用ルート（/auth/test-login）は「E2E_TEST_LOGIN==="true" かつ NODE_ENV!=="production"」
// でのみ動作するため、production ビルド（next start）ではなく development の dev サーバで起動する。
// これにより本番デプロイに誤って E2E_TEST_LOGIN を設定しても production では 404 となる防御が残る。
// dev サーバは NEXT_PUBLIC_* を実行時に process.env から読むため、ビルド時インライン化も不要。
const serverEnv: Record<string, string> = {
  NEXT_PUBLIC_SUPABASE_URL: process.env.NEXT_PUBLIC_SUPABASE_URL ?? "",
  NEXT_PUBLIC_SUPABASE_ANON_KEY: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ?? "",
  NEXT_PUBLIC_SITE_URL: baseURL,
  E2E_TEST_LOGIN: "true",
  E2E_TEST_EMAIL: process.env.E2E_TEST_EMAIL ?? "",
  E2E_TEST_PASSWORD: process.env.E2E_TEST_PASSWORD ?? "",
};

export default defineConfig({
  testDir: "./e2e",
  fullyParallel: true,
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: process.env.CI ? 1 : undefined,
  reporter: process.env.CI ? [["html"], ["list"]] : "list",
  use: {
    baseURL,
    trace: "on-first-retry",
  },
  projects: [
    // 認証セットアップ: /auth/test-login でサインインし storageState を保存する（#46 案2）。
    { name: "setup", testMatch: /auth\.setup\.ts/ },
    {
      name: "chromium",
      use: {
        ...devices["Desktop Chrome"],
        storageState: "e2e/.auth/user.json",
      },
      dependencies: ["setup"],
    },
  ],
  webServer: {
    command: `pnpm dev --port ${PORT}`,
    url: baseURL,
    reuseExistingServer: !process.env.CI,
    timeout: 180_000,
    env: serverEnv,
  },
});

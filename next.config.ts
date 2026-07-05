import type { NextConfig } from "next";

// 全レスポンスに付与するセキュリティヘッダ。
// CSP は inline style/script・Supabase・Google OAuth との整合確認が要るため段階導入とし、現状は含めない。
const securityHeaders = [
  // HTTPS を強制（2年・サブドメイン込み）。
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains; preload",
  },
  // クリックジャッキング対策。自サイトは iframe 埋め込みを想定しない。
  { key: "X-Frame-Options", value: "DENY" },
  // MIME スニッフィング抑止。
  { key: "X-Content-Type-Options", value: "nosniff" },
  // リファラの外部流出を最小化。
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // 未使用のブラウザ機能を無効化。
  {
    key: "Permissions-Policy",
    value: "camera=(), microphone=(), geolocation=(), browsing-topics=()",
  },
];

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/:path*",
        headers: securityHeaders,
      },
    ];
  },
};

export default nextConfig;

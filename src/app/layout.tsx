import type { Metadata, Viewport } from "next";
import { Geist } from "next/font/google";
import "./globals.css";
import { AppleSplashLinks } from "@/components/AppleSplashLinks";
import { VersionBadge } from "@/components/VersionBadge";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "count-upper",
  description: "日々の数えたい何かをカウントし、記録・可視化するアプリ",
  applicationName: "count-upper",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "count-upper",
  },
  icons: {
    apple: "/icons/apple-touch-icon.png",
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  // ピンチズームを許可する（拡大制限は a11y 上の減点要因のため設けない）
  themeColor: "#38bdf8",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ja" className={`${geistSans.variable} h-full antialiased`}>
      <body className="min-h-full flex flex-col bg-neutral-50 text-neutral-900">
        <AppleSplashLinks />
        {children}
        <VersionBadge />
      </body>
    </html>
  );
}

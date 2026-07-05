import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { ToastProvider } from "@/components/Toast";
import { PullToRefresh } from "@/components/PullToRefresh";

export default async function AppLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  return (
    <ToastProvider>
      <div className="flex min-h-full flex-col">
        <header className="sticky top-0 z-10 border-b border-neutral-200 bg-white/80 backdrop-blur">
          <div className="mx-auto flex w-full max-w-3xl items-center justify-between px-4 py-3">
            <span className="text-lg font-black tracking-tight">
              count-upper
            </span>
            <form action="/auth/signout" method="post">
              <button className="text-xs font-medium text-neutral-500 hover:text-neutral-900">
                ログアウト
              </button>
            </form>
          </div>
        </header>
        <main className="mx-auto w-full max-w-3xl flex-1 px-4 py-6">
          <PullToRefresh>{children}</PullToRefresh>
        </main>
      </div>
    </ToastProvider>
  );
}

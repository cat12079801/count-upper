"use client";

import {
  useEffect,
  useRef,
  useState,
  useTransition,
  type ReactNode,
} from "react";
import { useRouter } from "next/navigation";

const THRESHOLD = 70; // これ以上引いたら更新
const MAX_PULL = 110; // 見た目上の最大引っ張り量
const DAMPING = 0.5; // 実移動量に対する減衰

// PWA standalone 起動時の「引っ張って更新」。ブラウザ標準の pull-to-refresh は
// standalone で無効化されるため自前実装する。全体リロードではなく router.refresh()
// でサーバデータのみ再取得し、入力状態は保持する（TZ 方針とは無関係）。
export function PullToRefresh({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [pull, setPull] = useState(0);
  const [dragging, setDragging] = useState(false);
  const [isRefreshing, startTransition] = useTransition();

  const startY = useRef<number | null>(null);
  const pullRef = useRef(0);

  useEffect(() => {
    const standalone =
      window.matchMedia?.("(display-mode: standalone)").matches ||
      ("standalone" in navigator &&
        (navigator as { standalone?: boolean }).standalone === true);
    if (!standalone) return;

    function onTouchStart(e: TouchEvent) {
      if (window.scrollY <= 0 && e.touches.length === 1) {
        startY.current = e.touches[0].clientY;
        setDragging(true);
      } else {
        startY.current = null;
      }
    }

    function onTouchMove(e: TouchEvent) {
      if (startY.current === null || isRefreshing) return;
      const dy = e.touches[0].clientY - startY.current;
      if (dy <= 0) {
        pullRef.current = 0;
        setPull(0);
        return;
      }
      const dist = Math.min(MAX_PULL, dy * DAMPING);
      pullRef.current = dist;
      setPull(dist);
      // 上端からの下方向ドラッグ中のみ標準スクロールを抑止する
      e.preventDefault();
    }

    function onTouchEnd() {
      if (startY.current === null) return;
      startY.current = null;
      setDragging(false);
      if (pullRef.current >= THRESHOLD) {
        startTransition(() => router.refresh());
      }
      setPull(0);
      pullRef.current = 0;
    }

    window.addEventListener("touchstart", onTouchStart, { passive: true });
    window.addEventListener("touchmove", onTouchMove, { passive: false });
    window.addEventListener("touchend", onTouchEnd, { passive: true });
    window.addEventListener("touchcancel", onTouchEnd, { passive: true });
    return () => {
      window.removeEventListener("touchstart", onTouchStart);
      window.removeEventListener("touchmove", onTouchMove);
      window.removeEventListener("touchend", onTouchEnd);
      window.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [isRefreshing, router]);

  const active = pull > 0 || isRefreshing;
  // 更新中は固定位置にスピナーを表示し、ドラッグ中は指に追従させる
  const offset = isRefreshing ? 50 : pull;

  return (
    <>
      <div
        aria-hidden={!active}
        className="pointer-events-none fixed inset-x-0 top-0 z-40 flex justify-center"
        style={{
          transform: `translateY(${offset}px)`,
          opacity: active ? 1 : 0,
          transition: dragging ? "none" : "transform .2s ease, opacity .2s ease",
        }}
      >
        <div
          className={`mt-1 flex h-9 w-9 items-center justify-center rounded-full bg-white shadow ring-1 ring-neutral-200 ${
            isRefreshing || pull >= THRESHOLD ? "animate-spin" : ""
          }`}
        >
          <span className="block h-4 w-4 rounded-full border-2 border-neutral-300 border-t-accent" />
        </div>
      </div>
      {children}
    </>
  );
}

"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  type ReactNode,
} from "react";

// PullToRefresh は layout（AppClient より上位）にあるため、AppClient が持つ
// 裏取得（refresh）を context 経由で共有する。AppClient が自身の refresh を
// 登録し、PullToRefresh がそれを発火する。

type RefreshCtx = {
  register: (fn: () => void) => void;
  trigger: () => void;
};

const Ctx = createContext<RefreshCtx | null>(null);

export function RefreshProvider({ children }: { children: ReactNode }) {
  const fnRef = useRef<(() => void) | null>(null);
  const register = useCallback((fn: () => void) => {
    fnRef.current = fn;
  }, []);
  const trigger = useCallback(() => {
    fnRef.current?.();
  }, []);
  return <Ctx.Provider value={{ register, trigger }}>{children}</Ctx.Provider>;
}

// AppClient から自身の refresh を登録する。
export function useRegisterRefresh(fn: () => void) {
  const ctx = useContext(Ctx);
  useEffect(() => {
    ctx?.register(fn);
  }, [ctx, fn]);
}

// PullToRefresh から裏取得を発火する。context 外では no-op。
export function useTriggerRefresh(): () => void {
  const ctx = useContext(Ctx);
  return ctx?.trigger ?? (() => {});
}

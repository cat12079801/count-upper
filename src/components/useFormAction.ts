"use client";

import { useActionState, useEffect, useRef } from "react";
import { useToast } from "./Toast";
import type { ActionResult } from "@/app/app/actions";

type Action = (
  prev: ActionResult | null,
  formData: FormData,
) => Promise<ActionResult>;

type Options = {
  successMessage?: string;
  onSuccess?: () => void;
};

// サーバアクションを useActionState でラップし、失敗はトースト表示、
// 成功は任意のメッセージ表示とコールバックを行う。pending も返す。
export function useFormAction(action: Action, opts?: Options) {
  const { show } = useToast();
  const [state, formAction, pending] = useActionState(action, null);
  const seen = useRef<ActionResult | null>(null);
  const successMessage = opts?.successMessage;
  const onSuccess = opts?.onSuccess;

  useEffect(() => {
    if (!state || seen.current === state) return;
    seen.current = state; // effect 内での更新なので render 中の ref アクセスにはならない
    if (state.ok) {
      if (successMessage) show(successMessage, "success");
      onSuccess?.();
    } else {
      show(state.error, "error");
    }
  }, [state, show, successMessage, onSuccess]);

  return { formAction, pending };
}

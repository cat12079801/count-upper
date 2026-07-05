"use client";

import { useFormStatus } from "react-dom";
import type { ReactNode } from "react";

// form の送信中は自動で pending になり、二重送信を防ぐ送信ボタン。
export function SubmitButton({
  idle,
  pending,
  className,
  "aria-label": ariaLabel,
}: {
  idle: ReactNode;
  pending: ReactNode;
  className?: string;
  "aria-label"?: string;
}) {
  const { pending: isPending } = useFormStatus();
  return (
    <button disabled={isPending} className={className} aria-label={ariaLabel}>
      {isPending ? pending : idle}
    </button>
  );
}

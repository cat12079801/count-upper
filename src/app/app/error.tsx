"use client";

export default function AppError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="mx-auto mt-16 max-w-sm text-center">
      <h2 className="text-lg font-bold">エラーが発生しました</h2>
      <p className="mt-2 text-sm text-neutral-500">
        {error.message || "時間をおいて再度お試しください。"}
      </p>
      <button
        onClick={reset}
        className="mt-6 rounded-full bg-neutral-900 px-6 py-2.5 text-sm font-semibold text-white hover:bg-neutral-700"
      >
        再試行
      </button>
    </div>
  );
}

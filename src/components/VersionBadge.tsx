// ビルド識別子を控えめに表示する。スマホで「今どのバージョンが見えているか」を
// 判別し、キャッシュが残っていないかを確認できるようにする。
export function VersionBadge() {
  const sha = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "local";
  const built = process.env.NEXT_PUBLIC_BUILD_TIME ?? "";
  // ISO を分単位まで簡易表示
  const builtLabel = built ? built.slice(0, 16).replace("T", " ") : "";
  return (
    <footer className="py-4 text-center text-[10px] text-neutral-400 tabular-nums">
      {sha}
      {builtLabel ? ` · ${builtLabel} UTC` : ""}
    </footer>
  );
}

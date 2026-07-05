// ビルド識別子を控えめに表示する。スマホで「今どのバージョンが見えているか」を
// 判別し、キャッシュが残っていないかを確認できるようにする。
// ビルド時刻(ISO/UTC)を JST の YYYY-MM-DD HH:mm へ整形する。
// timeZone を固定するため SSR/CSR で表示が一致する。
function toJst(iso: string): string {
  const parts = new Intl.DateTimeFormat("ja-JP", {
    timeZone: "Asia/Tokyo",
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date(iso));
  const p = Object.fromEntries(parts.map((x) => [x.type, x.value]));
  return `${p.year}-${p.month}-${p.day} ${p.hour}:${p.minute}`;
}

export function VersionBadge() {
  const sha = process.env.NEXT_PUBLIC_COMMIT_SHA ?? "local";
  const built = process.env.NEXT_PUBLIC_BUILD_TIME ?? "";
  const builtLabel = built ? toJst(built) : "";
  return (
    <footer className="py-4 text-center text-[10px] text-neutral-400 tabular-nums">
      {sha}
      {builtLabel ? ` · ${builtLabel} JST` : ""}
    </footer>
  );
}

// 日付ユーティリティ（YYYY-MM-DD 文字列を扱う）。
//
// タイムゾーン方針:
// 本アプリの日付は「ユーザーのローカルタイムゾーン」を基準とする。
// - todayStr() / toDateStr() はクライアントで呼ぶと利用者のローカル日付になる。
//   記録フォームの既定値・上限、既定表示月はクライアント基準で決める。
// - サーバ（Vercel は UTC 実行）では実行環境の「今日」が利用者のローカル日付と
//   ずれ得るため、サーバ側の未来日検証には maxLoggableDateStr() の許容幅を使い、
//   いかなる TZ の正当な「今日」も弾かないようにする。
// - 集計は logged_on 文字列をそのまま日/月に分解するため TZ 変換を挟まない。

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
}

// サーバ側の未来日検証で使う上限（YYYY-MM-DD）。
// UTC の翌日まで許容することで、UTC より進んだ TZ（最大 UTC+14）の利用者が
// 自分の「今日」を記録しようとしてもサーバ実行環境の UTC 日付で弾かれないようにする。
export function maxLoggableDateStr(): string {
  const now = new Date();
  const utcTomorrow = new Date(
    Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + 1),
  );
  const y = utcTomorrow.getUTCFullYear();
  const m = String(utcTomorrow.getUTCMonth() + 1).padStart(2, "0");
  const day = String(utcTomorrow.getUTCDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// 月の日数
export function daysInMonth(year: number, month1to12: number): number {
  return new Date(year, month1to12, 0).getDate();
}

// 指定月の開始日・終了日（YYYY-MM-DD）
export function monthRange(year: number, month1to12: number) {
  const last = daysInMonth(year, month1to12);
  const mm = String(month1to12).padStart(2, "0");
  return {
    start: `${year}-${mm}-01`,
    end: `${year}-${mm}-${String(last).padStart(2, "0")}`,
    days: last,
  };
}

// 指定年の開始日・終了日（YYYY-MM-DD）
export function yearRange(year: number) {
  return { start: `${year}-01-01`, end: `${year}-12-31` };
}

export function ymLabel(year: number, month1to12: number): string {
  return `${year}年${month1to12}月`;
}

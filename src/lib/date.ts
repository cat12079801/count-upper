// ローカルタイムゾーン基準の日付ユーティリティ（YYYY-MM-DD 文字列を扱う）

export function toDateStr(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export function todayStr(): string {
  return toDateStr(new Date());
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

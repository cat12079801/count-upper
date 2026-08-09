import type { Counter, CountLog } from "@/types/db";

// ローカルファースト用のスナップショットキャッシュ（localStorage）。
// - user 単位でキーを分け、共有端末でのアカウント混在を防ぐ。
// - private mode / quota 超過 / SSR 実行では例外を握りつぶし、null / no-op で継続する。

export type Snapshot = {
  counters: Counter[];
  logs: CountLog[];
  savedAt: number;
};

const VERSION = 1;
const keyFor = (userId: string) => `count-upper:snapshot:v${VERSION}:${userId}`;

export function loadSnapshot(userId: string): Snapshot | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.localStorage.getItem(keyFor(userId));
    if (!raw) return null;
    const parsed = JSON.parse(raw) as Snapshot;
    if (!parsed || !Array.isArray(parsed.counters) || !Array.isArray(parsed.logs)) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export function saveSnapshot(
  userId: string,
  data: { counters: Counter[]; logs: CountLog[] },
): void {
  if (typeof window === "undefined") return;
  try {
    const snap: Snapshot = {
      counters: data.counters,
      logs: data.logs,
      savedAt: Date.now(),
    };
    window.localStorage.setItem(keyFor(userId), JSON.stringify(snap));
  } catch {
    // quota 超過 / 書込不可はキャッシュ無しとして継続する
  }
}

export function clearSnapshot(userId: string): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.removeItem(keyFor(userId));
  } catch {
    // no-op
  }
}

// 表示に影響するフィールドのみで順序非依存の署名を作る。
function counterSig(c: Counter): string {
  return `${c.id}:${c.name}:${c.unit}:${c.daily_goal ?? ""}`;
}
function logSig(l: CountLog): string {
  return `${l.id}:${l.counter_id}:${l.count}:${l.logged_on}`;
}

function signature(data: { counters: Counter[]; logs: CountLog[] }): string {
  const c = data.counters.map(counterSig).sort().join("|");
  const l = data.logs.map(logSig).sort().join("|");
  return `${c}#${l}`;
}

// 表示に影響する差分があれば true。裏取得後の再描画要否判定に使う。
export function diffSnapshot(
  a: { counters: Counter[]; logs: CountLog[] },
  b: { counters: Counter[]; logs: CountLog[] },
): boolean {
  return signature(a) !== signature(b);
}

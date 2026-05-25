import { QuickMemo, GroupedMemos } from "../../core/models/types";

export function addMemo(memos: QuickMemo[], newMemo: QuickMemo): QuickMemo[] {
  if (memos.some((m) => m.id === newMemo.id)) {
    throw new Error(`Memo with ID ${newMemo.id} already exists.`);
  }
  return [...memos, newMemo];
}

export function updateMemo(
  memos: QuickMemo[],
  updated: QuickMemo,
): QuickMemo[] {
  if (!memos.some((m) => m.id === updated.id)) {
    throw new Error(`Memo with ID ${updated.id} not found.`);
  }
  return memos.map((m) => (m.id === updated.id ? { ...updated } : m));
}

export function removeMemo(memos: QuickMemo[], idToRemove: string): QuickMemo[] {
  return memos.filter((m) => m.id !== idToRemove);
}

export function importMemos(
  localMemos: QuickMemo[],
  importedMemos: QuickMemo[],
): QuickMemo[] {
  const localMap = new Map(localMemos.map((m) => [m.id, m]));
  for (const imported of importedMemos) {
    const local = localMap.get(imported.id);
    if (!local || imported.updatedAt > local.updatedAt) {
      localMap.set(imported.id, imported);
    }
  }
  return Array.from(localMap.values());
}

/**
 * Validate the basic shape of memo creation parameters.
 * Throws on invalid input.
 */
export function validateMemoCreationParams(
  title: string,
  solarYear: number,
  solarMonth: number,
  solarDay: number,
): void {
  if (!title || !title.trim()) {
    throw new Error("Tiêu đề memo không được để trống");
  }
  if (!Number.isInteger(solarYear) || solarYear < 1901 || solarYear > 2099) {
    throw new Error("Năm dương lịch không hợp lệ");
  }
  if (!Number.isInteger(solarMonth) || solarMonth < 1 || solarMonth > 12) {
    throw new Error("Tháng dương lịch không hợp lệ");
  }
  if (!Number.isInteger(solarDay) || solarDay < 1 || solarDay > 31) {
    throw new Error("Ngày dương lịch không hợp lệ");
  }
  const probe = new Date(solarYear, solarMonth - 1, solarDay);
  if (
    probe.getFullYear() !== solarYear ||
    probe.getMonth() !== solarMonth - 1 ||
    probe.getDate() !== solarDay
  ) {
    throw new Error("Ngày dương lịch không tồn tại");
  }
}

/**
 * Group memos by title (case-insensitive trimmed key, but preserve
 * the most-recent entry's original title for display).
 * Within each group, memos are sorted by date desc (most recent first).
 * Groups are sorted by their most-recent memo date desc.
 */
export function groupMemosByTitle(memos: QuickMemo[]): GroupedMemos[] {
  const groups = new Map<string, QuickMemo[]>();
  for (const memo of memos) {
    const key = memo.title.trim().toLowerCase();
    const existing = groups.get(key);
    if (existing) {
      existing.push(memo);
    } else {
      groups.set(key, [memo]);
    }
  }

  const result: GroupedMemos[] = [];
  for (const groupMemos of groups.values()) {
    const sorted = [...groupMemos].sort(compareMemoByDateDesc);
    result.push({
      title: sorted[0].title.trim(),
      memos: sorted,
      lastDate: sorted[0].solarDate,
    });
  }
  result.sort((a, b) => compareSolarDateDesc(a.lastDate, b.lastDate));
  return result;
}

function compareMemoByDateDesc(a: QuickMemo, b: QuickMemo): number {
  return compareSolarDateDesc(a.solarDate, b.solarDate);
}

function compareSolarDateDesc(
  a: { year: number; month: number; day: number },
  b: { year: number; month: number; day: number },
): number {
  if (a.year !== b.year) return b.year - a.year;
  if (a.month !== b.month) return b.month - a.month;
  return b.day - a.day;
}

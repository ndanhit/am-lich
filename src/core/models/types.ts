export type LunarDate = {
  day: number;
  month: number;
};

export const MIN_YEAR = 1901;
export const MAX_YEAR = 2099;

export type SolarDate = {
  year: number;
  month: number;
  day: number;
};

export type LunarDateContext = {
  lunarDay: number;
  lunarMonth: number;
  lunarYear: number;
  isLeapMonth: boolean;
  canChiYear: string;
  canChiMonth: string;
  canChiDay: string;
  fateElement: string;
  auspiciousHours: string[];
  incompatibleAges: string[];
};

export enum LeapMonthRule {
  REGULAR_ONLY = "REGULAR_ONLY",
  LEAP_ONLY = "LEAP_ONLY",
  BOTH = "BOTH",
}

export enum RecurrenceRule {
  YEARLY = "YEARLY",
  MONTHLY = "MONTHLY",
  ONCE = "ONCE",
}

export type LunarEvent = {
  id: string;
  name: string;
  lunarDate: LunarDate;
  lunarYear?: number;
  recurrence: RecurrenceRule;
  leapMonthRule: LeapMonthRule;
  updatedAt: number;
  createdAt: number;
};

export type UpcomingEventOccurrence = {
  event: LunarEvent;
  solarDate: SolarDate;
  lunarContext?: LunarDateContext;
  isLeapMonthOccurrence: boolean;
  daysUntil: number;
};

export type ExportPayload = {
  version: number;
  exportedAt: number;
  events: LunarEvent[];
  memos?: QuickMemo[];
  people?: Person[];
  settings?: ExportSettings;
};

export type ExportSettings = {
  hiddenSystemEventIds?: string[];
};

export type GroupedUpcomingEvents = {
  year: number;
  occurrences: UpcomingEventOccurrence[];
};

/**
 * Quick memo: a non-recurring solar-date log entry used to track
 * when a real-world task was last done (e.g. cleaning the AC).
 */
export type QuickMemo = {
  id: string;
  title: string;
  note: string;
  solarDate: SolarDate;
  createdAt: number;
  updatedAt: number;
};

export type GroupedMemos = {
  title: string;
  memos: QuickMemo[];
  lastDate: SolarDate;
};

/** Giới tính của thành viên trong gia phả */
export type Gender = "male" | "female" | "other";

/**
 * A member of the family tree (gia phả).
 * Quan hệ huyết thống thể hiện qua một parentId (đời cha/mẹ trực hệ)
 * cộng spouseId (vợ/chồng). Danh sách Person phẳng — gốc cây là các
 * Person có parentId === null (cho phép nhiều dòng họ rời rạc).
 */
export type Person = {
  id: string;
  name: string;
  gender: Gender;
  birthDate: SolarDate | null;
  isDeceased: boolean;
  deathDate: SolarDate | null;
  /** false = nhánh chính (huyết thống); true = lấy vào (vợ/chồng) */
  isMarriedIn: boolean;
  parentId: string | null;
  spouseId: string | null;
  notes: string;
  createdAt: number;
  updatedAt: number;
};

/** Một nút trong cây gia phả đã dựng từ danh sách Person phẳng */
export type FamilyTreeNode = {
  person: Person;
  children: FamilyTreeNode[];
  depth: number;
};

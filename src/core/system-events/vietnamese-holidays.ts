import {
  LeapMonthRule,
  LunarEvent,
  RecurrenceRule,
} from "../models/types";

const SYSTEM_EVENT_PREFIX = "system:";

/**
 * Returns true when an event ID belongs to a built-in Vietnamese holiday.
 * System events are read-only and live in code, not localStorage.
 */
export function isSystemEventId(id: string): boolean {
  return id.startsWith(SYSTEM_EVENT_PREFIX);
}

function holiday(slug: string, name: string, day: number, month: number): LunarEvent {
  return {
    id: `${SYSTEM_EVENT_PREFIX}${slug}`,
    name,
    lunarDate: { day, month },
    recurrence: RecurrenceRule.YEARLY,
    leapMonthRule: LeapMonthRule.REGULAR_ONLY,
    createdAt: 0,
    updatedAt: 0,
  };
}

/**
 * Built-in Vietnamese traditional holidays, preloaded for every user.
 * Tất Niên (30/12 âm) won't appear in lunar years whose month 12 has only
 * 29 days — the occurrence engine skips it gracefully.
 */
export const VIETNAMESE_HOLIDAYS: ReadonlyArray<LunarEvent> = [
  holiday("tet-nguyen-dan", "Tết Nguyên Đán", 1, 1),
  holiday("ram-thang-gieng", "Rằm tháng Giêng", 15, 1),
  holiday("tet-han-thuc", "Tết Hàn Thực", 3, 3),
  holiday("gio-to-hung-vuong", "Giỗ tổ Hùng Vương", 10, 3),
  holiday("le-phat-dan", "Lễ Phật Đản", 15, 4),
  holiday("tet-doan-ngo", "Tết Đoan Ngọ", 5, 5),
  holiday("le-vu-lan", "Lễ Vu Lan", 15, 7),
  holiday("tet-trung-thu", "Tết Trung Thu", 15, 8),
  holiday("ong-cong-ong-tao", "Ông Công Ông Táo", 23, 12),
  holiday("tat-nien", "Tất Niên", 30, 12),
];

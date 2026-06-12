import type {
  SolarDate,
  PartialDate,
  LunarDateContext,
} from "../core/models/types";

/**
 * Formats a Solar date into dd/MM/yyyy string.
 */
export function formatSolarDate(date: SolarDate): string {
  const day = String(date.day).padStart(2, "0");
  const month = String(date.month).padStart(2, "0");
  return `${day}/${month}/${date.year}`;
}

/**
 * Formats a partially-known solar date, dropping unknown parts:
 * "dd/MM/yyyy" (full), "MM/yyyy" (year+month), or "yyyy" (year only).
 */
export function formatPartialDate(date: PartialDate): string {
  const year = String(date.year);
  if (date.month == null) return year;
  const month = String(date.month).padStart(2, "0");
  if (date.day == null) return `${month}/${year}`;
  const day = String(date.day).padStart(2, "0");
  return `${day}/${month}/${year}`;
}

/**
 * Formats a Lunar date context into a traditional Vietnamese string.
 * Example: "ngày 1 tháng 1 năm Bính Ngọ"
 */
export function formatLunarDate(context: LunarDateContext): string {
  const leapSuffix = context.isLeapMonth ? " (nhuận)" : "";
  return `Ngày ${context.lunarDay} Tháng ${context.lunarMonth}${leapSuffix} năm ${context.canChiYear}`;
}

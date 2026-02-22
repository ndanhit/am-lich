import type { SolarDate, LunarDateContext } from '../core/models/types';

/**
 * Formats a Solar date into dd/MM/yyyy string.
 */
export function formatSolarDate(date: SolarDate): string {
    const day = String(date.day).padStart(2, '0');
    const month = String(date.month).padStart(2, '0');
    return `${day}/${month}/${date.year}`;
}

/**
 * Formats a Lunar date context into a traditional Vietnamese string.
 * Example: "ngày 1 tháng 1 năm Bính Ngọ"
 */
export function formatLunarDate(context: LunarDateContext): string {
    const leapSuffix = context.isLeapMonth ? ' (nhuận)' : '';
    return `ngày ${context.lunarDay} tháng ${context.lunarMonth}${leapSuffix} năm ${context.canChiYear}`;
}

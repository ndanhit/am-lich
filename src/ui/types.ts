import type { LunarEvent, SolarDate, UpcomingEventOccurrence, LunarDateContext } from '../lib/index';
import { LeapMonthRule } from '../lib/index';

/** A single cell in the monthly calendar grid */
export type CalendarCell = {
    date: SolarDate;
    lunar?: LunarDateContext;
    isCurrentMonth: boolean;
    isToday: boolean;
    isFirstDayOfLunar?: boolean;
    events: UpcomingEventOccurrence[];
};

/** Complete view model for a rendered monthly calendar */
export type CalendarViewModel = {
    year: number;
    month: number;
    cells: CalendarCell[];
    monthLabel: string;
};

/** DTO for the create/edit event form */
export type EventFormData = {
    name: string;
    lunarDay: number;
    lunarMonth: number;
    leapMonthRule: LeapMonthRule;
};

/** Active view in the app */
export type AppView = 'calendar' | 'upcoming';

/** Human-readable labels for leap month rules */
export const LEAP_MONTH_LABELS: Record<LeapMonthRule, string> = {
    [LeapMonthRule.REGULAR_ONLY]: 'Chỉ tháng thường',
    [LeapMonthRule.LEAP_ONLY]: 'Chỉ tháng nhuận',
    [LeapMonthRule.BOTH]: 'Cả hai',
};

/** Month names for calendar header */
export const MONTH_NAMES = [
    'Tháng 1', 'Tháng 2', 'Tháng 3', 'Tháng 4', 'Tháng 5', 'Tháng 6',
    'Tháng 7', 'Tháng 8', 'Tháng 9', 'Tháng 10', 'Tháng 11', 'Tháng 12',
];

/** Short month names for upcoming badges */
export const MONTH_NAMES_SHORT = [
    'Th1', 'Th2', 'Th3', 'Th4', 'Th5', 'Th6',
    'Th7', 'Th8', 'Th9', 'Th10', 'Th11', 'Th12',
];

/** Day-of-week headers */
export const WEEKDAY_HEADERS = ['CN', 'T2', 'T3', 'T4', 'T5', 'T6', 'T7'];

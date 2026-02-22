import type { LunarEvent, SolarDate, UpcomingEventOccurrence } from '../lib/index';
import { LeapMonthRule } from '../lib/index';

/** A single cell in the monthly calendar grid */
export type CalendarCell = {
    date: SolarDate;
    isCurrentMonth: boolean;
    isToday: boolean;
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
    [LeapMonthRule.REGULAR_ONLY]: 'Regular month only',
    [LeapMonthRule.LEAP_ONLY]: 'Leap month only',
    [LeapMonthRule.BOTH]: 'Both',
};

/** Month names for calendar header */
export const MONTH_NAMES = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December',
];

/** Short month names for upcoming badges */
export const MONTH_NAMES_SHORT = [
    'Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
    'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec',
];

/** Day-of-week headers */
export const WEEKDAY_HEADERS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

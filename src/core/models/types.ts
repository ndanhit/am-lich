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
    REGULAR_ONLY = 'REGULAR_ONLY',
    LEAP_ONLY = 'LEAP_ONLY',
    BOTH = 'BOTH',
}

export enum RecurrenceRule {
    YEARLY = 'YEARLY',
    MONTHLY = 'MONTHLY',
    ONCE = 'ONCE',
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
};

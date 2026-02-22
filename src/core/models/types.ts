export type LunarDate = {
    day: number;
    month: number;
};

export type SolarDate = {
    year: number;
    month: number;
    day: number;
};

export enum LeapMonthRule {
    REGULAR_ONLY = 'REGULAR_ONLY',
    LEAP_ONLY = 'LEAP_ONLY',
    BOTH = 'BOTH',
}

export type LunarEvent = {
    id: string;
    name: string;
    lunarDate: LunarDate;
    leapMonthRule: LeapMonthRule;
    updatedAt: number;
    createdAt: number;
};

export type UpcomingEventOccurrence = {
    event: LunarEvent;
    solarDate: SolarDate;
    isLeapMonthOccurrence: boolean;
    daysUntil: number;
};

export type ExportPayload = {
    version: number;
    exportedAt: number;
    events: LunarEvent[];
};

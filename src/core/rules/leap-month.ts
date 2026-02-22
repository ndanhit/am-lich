import { LunarDate, LeapMonthRule } from '../models/types';

/**
 * Ensures a new generic repeating event satisfies mathematical bounds cleanly before saving.
 */
export function validateEventCreationParams(date: LunarDate, rule: LeapMonthRule): void {
    if (date.month < 1 || date.month > 12) {
        throw new Error('Lunar month must be between 1 and 12');
    }

    if (date.day < 1 || date.day > 30) {
        throw new Error('Lunar day must be between 1 and 30');
    }

    if (!Object.values(LeapMonthRule).includes(rule)) {
        throw new Error('Invalid LeapMonthRule provided');
    }
}

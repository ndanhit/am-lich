import { describe, it, expect } from 'vitest';
import { validateEventCreationParams } from '../../src/core/rules/leap-month';
import { LunarDate, LeapMonthRule } from '../../src/core/models/types';

describe('Leap Month Rules & Bounds Filtering', () => {

    describe('validateEventCreationParams', () => {
        it('should allow valid regular dates', () => {
            const date: LunarDate = { day: 15, month: 8 };
            // Assuming validation passes if it doesn't throw
            expect(() => validateEventCreationParams(date, LeapMonthRule.REGULAR_ONLY)).not.toThrow();
        });

        it('should throw an error for day > 30', () => {
            const date: LunarDate = { day: 31, month: 8 };
            expect(() => validateEventCreationParams(date, LeapMonthRule.REGULAR_ONLY)).toThrow();
        });

        it('should throw an error for month > 12', () => {
            const date: LunarDate = { day: 15, month: 13 };
            expect(() => validateEventCreationParams(date, LeapMonthRule.REGULAR_ONLY)).toThrow();
        });

        it('should throw an error when days < 1 or month < 1', () => {
            expect(() => validateEventCreationParams({ day: 0, month: 1 }, LeapMonthRule.REGULAR_ONLY)).toThrow();
            expect(() => validateEventCreationParams({ day: 1, month: 0 }, LeapMonthRule.REGULAR_ONLY)).toThrow();
        });
    });

});

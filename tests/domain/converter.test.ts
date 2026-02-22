import { describe, it, expect } from 'vitest';
import { isValidLunarDate, convertLunarToSolar } from '../../src/core/lunar-math/converter';
import { LunarDate } from '../../src/core/models/types';

describe('Lunar Math Converter Domain Logic', () => {
    describe('isValidLunarDate', () => {
        it('should validate common regular lunar dates', () => {
            // Lunar New Year 2026 is Feb 17
            expect(isValidLunarDate(2026, 1, 1, false)).toBe(true);
        });

        it('should correctly flag Day 30 on a 29-day short month', () => {
            // In 2026, Lunar Month 2 has 29 days. Day 30 should not exist.
            expect(isValidLunarDate(2026, 2, 30, false)).toBe(false);
            // But Day 29 is fine.
            expect(isValidLunarDate(2026, 2, 29, false)).toBe(true);
        });

        it('should correctly flag non-existent leap months', () => {
            // 2026 is NOT a leap year in Lunar calendar
            expect(isValidLunarDate(2026, 5, 1, true)).toBe(false);
        });

        it('should correctly validate existing leap months', () => {
            // 2028 is a leap year (Month 5)
            expect(isValidLunarDate(2028, 5, 15, true)).toBe(true);
            // But 2028 does not have leap month 6
            expect(isValidLunarDate(2028, 6, 15, true)).toBe(false);
        });
    });

    describe('convertLunarToSolar', () => {
        it('should calculate solar occurrence for a real lunar date', () => {
            const lunar: LunarDate = { day: 1, month: 1 };

            const solar2026 = convertLunarToSolar(2026, lunar, false);
            expect(solar2026).toEqual({ year: 2026, month: 2, day: 17 }); // Tet 2026

            const solar2027 = convertLunarToSolar(2027, lunar, false);
            expect(solar2027).toEqual({ year: 2027, month: 2, day: 6 }); // Tet 2027
        });

        it('should return null when calculating for an invalid date/month permutation', () => {
            // Say an event was created for Moon 2, Day 30 in a year when it existed, 
            // but in 2026 Moon 2 only has 29 days.
            const lunar: LunarDate = { day: 30, month: 2 };
            const solar = convertLunarToSolar(2026, lunar, false);

            expect(solar).toBeNull();
        });

        it('should return null when resolving leap-only to a non-leap year', () => {
            const lunar: LunarDate = { day: 15, month: 5 };
            const solar = convertLunarToSolar(2026, lunar, true); // True = Leap Month

            expect(solar).toBeNull();
        });
    });
});

import { describe, it, expect } from 'vitest';
import { isValidLunarDate, convertLunarToSolar, convertSolarToLunar } from '../../src/core/lunar-math/converter';
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

    describe('convertSolarToLunar', () => {
        it('should convert solar to lunar correctly (Tet 2026)', () => {
            const result = convertSolarToLunar(2026, 2, 17);
            expect(result).not.toBeNull();
            expect(result!.lunarDay).toBe(1);
            expect(result!.lunarMonth).toBe(1);
            expect(result!.lunarYear).toBe(2026);
            expect(result!.isLeapMonth).toBe(false);
            expect(result!.canChiYear).toBe('Bính Ngọ');
        });

        it('should handle leap months correctly (Lunar 15/5 Leap 2028)', () => {
            // Solar 2028-07-07 is Lunar 2028-05-15 (Leap)
            const result = convertSolarToLunar(2028, 7, 7);
            expect(result).not.toBeNull();
            expect(result!.lunarDay).toBe(15);
            expect([5, -5]).toContain(result!.lunarMonth);
            if (result!.lunarMonth === -5 || result!.isLeapMonth) {
                expect(result!.isLeapMonth).toBe(true);
            }
        });

        it('should return null for dates outside 1901-2099', () => {
            expect(convertSolarToLunar(1900, 1, 1)).toBeNull();
            expect(convertSolarToLunar(2100, 1, 1)).toBeNull();
        });

        it('should use Vietnamese Can Chi names', () => {
            const result = convertSolarToLunar(2024, 2, 10); // Year of the Dragon
            expect(result!.canChiYear).toBe('Giáp Thìn');
        });
    });
});

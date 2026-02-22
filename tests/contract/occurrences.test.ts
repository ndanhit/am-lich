import { describe, it, expect } from 'vitest';
import { calculateOccurrencesForYear } from '../../src/lib/index';
import { LunarEvent, LeapMonthRule } from '../../src/core/models/types';

describe('Occurrences Core API Contract', () => {
    const tetEvent: LunarEvent = {
        id: 'tet-event',
        name: 'Lunar New Year',
        lunarDate: { day: 1, month: 1 },
        leapMonthRule: LeapMonthRule.REGULAR_ONLY,
        createdAt: 0,
        updatedAt: 0
    };

    it('should project exactly 1 solar occurrence per regular lunar event in a standard year', () => {
        const occurrences2026 = calculateOccurrencesForYear([tetEvent], 2026);

        expect(occurrences2026).toHaveLength(1);
        expect(occurrences2026[0].event.id).toBe('tet-event');
        expect(occurrences2026[0].solarDate.year).toBe(2026);
        expect(occurrences2026[0].solarDate.month).toBe(2);
        expect(occurrences2026[0].solarDate.day).toBe(17);
        expect(occurrences2026[0].isLeapMonthOccurrence).toBe(false);
    });

    it('should gracefully skip events spanning non-existent leap months returning 0 occurrences', () => {
        const leapEvent: LunarEvent = {
            id: 'unavailable-leap',
            name: 'Only happens in Leap Month 5',
            lunarDate: { day: 15, month: 5 },
            leapMonthRule: LeapMonthRule.LEAP_ONLY,
            createdAt: 0,
            updatedAt: 0
        };

        // 2026 does not have a leap month 5
        const occurrences2026 = calculateOccurrencesForYear([leapEvent], 2026);
        expect(occurrences2026).toHaveLength(0);
    });

    it('should return 2 occurrences for BOTH rule in matching leap years', () => {
        const leapEventBoth: LunarEvent = {
            id: 'both-leap',
            name: 'Happens in Month 5 and Leap Month 5',
            lunarDate: { day: 15, month: 5 },
            leapMonthRule: LeapMonthRule.BOTH,
            createdAt: 0,
            updatedAt: 0
        };

        // 2028 has a leap month 5
        const occurrences2028 = calculateOccurrencesForYear([leapEventBoth], 2028);
        expect(occurrences2028).toHaveLength(2);
        // Ensure standard occurs first chronologically
        expect(occurrences2028[0].isLeapMonthOccurrence).toBe(false);
        expect(occurrences2028[1].isLeapMonthOccurrence).toBe(true);
    });
});

import { describe, it, expect } from 'vitest';
import { getUpcomingEvents } from '../../src/application/queries/upcoming';
import { LunarEvent, LeapMonthRule, SolarDate } from '../../src/core/models/types';

describe('Chronological Upcoming Events Pipeline', () => {

    const events: LunarEvent[] = [
        {
            id: 'evt-1',
            name: 'Lunar New Year',
            lunarDate: { day: 1, month: 1 },
            leapMonthRule: LeapMonthRule.REGULAR_ONLY,
            createdAt: 0,
            updatedAt: 0
        },
        {
            id: 'evt-2',
            name: 'Mid-Autumn Festival',
            lunarDate: { day: 15, month: 8 },
            leapMonthRule: LeapMonthRule.REGULAR_ONLY,
            createdAt: 0,
            updatedAt: 0
        },
        {
            id: 'evt-3',
            name: 'End of Year',
            lunarDate: { day: 29, month: 12 }, // Safe date
            leapMonthRule: LeapMonthRule.REGULAR_ONLY,
            createdAt: 0,
            updatedAt: 0
        }
    ];

    it('should correctly sort upcoming events chronologically from a given solar date', () => {
        // Set reference date to Jan 1, 2026.
        // 2026 Lunar New Year is Feb 17.
        // Mid-Autumn is Sep 25, 2026.
        // End of Year is Feb 5, 2027.
        const referenceSolar: SolarDate = { year: 2026, month: 1, day: 1 };

        // We want occurrences for the current year (2026) AND the next year bounding.
        // In real app, we might ask for 'next 30 events' or just cross the year boundary safely.
        const upcoming = getUpcomingEvents(events, referenceSolar, 5);

        expect(upcoming.length).toBeGreaterThanOrEqual(3);

        // Assert sorting order
        expect(upcoming[0].event.id).toBe('evt-1'); // LNY 2026
        expect(upcoming[1].event.id).toBe('evt-2'); // Mid-Autumn 2026
        expect(upcoming[2].event.id).toBe('evt-3'); // End of Year L2026 (Solar 2027)

        // Assert daysUntil is cleanly positive and ascending
        expect(upcoming[0].daysUntil).toBeGreaterThan(0);
        expect(upcoming[1].daysUntil).toBeGreaterThan(upcoming[0].daysUntil);
        expect(upcoming[2].daysUntil).toBeGreaterThan(upcoming[1].daysUntil);
    });

    it('should correctly filter out events that already passed this year', () => {
        // Set reference to March 1, 2026 (After Lunar New Year)
        const referenceSolar: SolarDate = { year: 2026, month: 3, day: 1 };

        const upcoming = getUpcomingEvents(events, referenceSolar, 3);

        // LNY 2026 shouldn't be first, it should be Mid-Autumn 2026
        expect(upcoming[0].event.id).toBe('evt-2');
        // Second should be End of Year 2026
        expect(upcoming[1].event.id).toBe('evt-3');
        // Third should be LNY 2027!
        expect(upcoming[2].event.id).toBe('evt-1');
        expect(upcoming[2].solarDate.year).toBe(2027);
    });
});

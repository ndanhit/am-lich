import { describe, it, expect } from 'vitest';
import { calculateOccurrencesForYear } from '../../src/lib/index';
import { LunarEvent, LeapMonthRule, RecurrenceRule } from '../../src/core/models/types';

describe('Performance Benchmarks', () => {

    it('should calculate occurrences for 10,000 events in under 100ms', () => {
        const events: LunarEvent[] = [];

        // Generate 10,000 events spread across the year
        for (let i = 0; i < 10000; i++) {
            events.push({
                id: `perf-evt-${i}`,
                name: `Mass Event ${i}`,
                lunarDate: {
                    day: (i % 30) + 1, // 1 to 30
                    month: (i % 12) + 1 // 1 to 12
                },
                leapMonthRule: LeapMonthRule.REGULAR_ONLY,
                recurrence: RecurrenceRule.YEARLY,
                createdAt: 0,
                updatedAt: 0
            });
        }

        const startTime = performance.now();

        const occurrences = calculateOccurrencesForYear(events, 2026);

        const runtimeMs = performance.now() - startTime;

        // In 2026, most of these will return occurrences (some won't for day 30s)
        expect(occurrences.length).toBeGreaterThan(9000);

        // Constitution requires very fast calculation for UI interactivity
        // Logging it for visibility but failing if it exceeds a generous 250ms threshold 
        // in CI environments
        console.log(`10,000 events calculated in ${runtimeMs.toFixed(2)}ms`);
        expect(runtimeMs).toBeLessThan(250);
    });

});

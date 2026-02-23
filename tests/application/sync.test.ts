import { describe, it, expect } from 'vitest';
import { importEvents } from '../../src/application/sync/import';
import { LunarEvent, LeapMonthRule, RecurrenceRule } from '../../src/core/models/types';

describe('Deterministic Import Merge Sync', () => {

    const localEvt1: LunarEvent = {
        id: '1', name: 'Original', lunarDate: { day: 1, month: 1 },
        leapMonthRule: LeapMonthRule.REGULAR_ONLY, recurrence: RecurrenceRule.YEARLY, createdAt: 10, updatedAt: 10
    };

    it('should add completely new events from imported payload', () => {
        const importPayload: LunarEvent[] = [{
            id: '2', name: 'New Event', lunarDate: { day: 2, month: 2 },
            leapMonthRule: LeapMonthRule.REGULAR_ONLY, recurrence: RecurrenceRule.YEARLY, createdAt: 20, updatedAt: 20
        }];

        const merged = importEvents([localEvt1], importPayload);
        expect(merged).toHaveLength(2);

        // Assert sorting or basic inclusion
        expect(merged.find(e => e.id === '1')).toBeDefined();
        expect(merged.find(e => e.id === '2')).toBeDefined();
    });

    it('should overwrite old local events if imported event has newer updatedAt', () => {
        const importedEvt1: LunarEvent = {
            id: '1', name: 'Updated Event', lunarDate: { day: 1, month: 1 },
            leapMonthRule: LeapMonthRule.REGULAR_ONLY, recurrence: RecurrenceRule.YEARLY, createdAt: 10, updatedAt: 50 // newer
        };

        const merged = importEvents([localEvt1], [importedEvt1]);

        expect(merged).toHaveLength(1);
        expect(merged[0].name).toBe('Updated Event');
        expect(merged[0].updatedAt).toBe(50);
    });

    it('should retain newly modified local events if imported is older', () => {
        const importedEvt1: LunarEvent = {
            id: '1', name: 'Stale Event', lunarDate: { day: 1, month: 1 },
            leapMonthRule: LeapMonthRule.REGULAR_ONLY, recurrence: RecurrenceRule.YEARLY, createdAt: 10, updatedAt: 5 // older 5 < 10
        };

        const merged = importEvents([localEvt1], [importedEvt1]);

        expect(merged).toHaveLength(1);
        expect(merged[0].name).toBe('Original');
        expect(merged[0].updatedAt).toBe(10);
    });

});

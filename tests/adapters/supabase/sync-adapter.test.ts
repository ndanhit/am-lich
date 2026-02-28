import { describe, it, expect } from 'vitest';
import { SyncAdapter } from '../../../src/adapters/supabase/sync-adapter';
import type { LunarEvent } from '../../../src/lib/index';
import { RecurrenceRule, LeapMonthRule } from '../../../src/lib/index';

describe('SyncAdapter', () => {
    it('should have a backupEvents method resolving to void', async () => {
        const dummyEvents: LunarEvent[] = [{
            id: 'test-1',
            name: 'Test Event',
            lunarDate: { day: 1, month: 1 },
            recurrence: RecurrenceRule.YEARLY,
            leapMonthRule: LeapMonthRule.REGULAR_ONLY,
            createdAt: Date.now(),
            updatedAt: Date.now()
        }];

        await expect(SyncAdapter.backupEvents(dummyEvents)).resolves.toBeUndefined();
    });

    it('should have a restoreEvents method resolving to null by default', async () => {
        const result = await SyncAdapter.restoreEvents();
        expect(result).toBeNull();
    });
});

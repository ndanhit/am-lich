import { LunarEvent, UpcomingEventOccurrence, LeapMonthRule, RecurrenceRule, LunarDate } from '../core/models/types';
import { convertLunarToSolar, convertSolarToLunar } from '../core/lunar-math/converter';
import { LunarYear } from 'lunar-javascript';

export { convertLunarToSolar, convertSolarToLunar };
export * from './formatters';

/**
 * Validates constraints around Leap Month behavior (US2) and computes the valid
 * targeted solar dates according to exactly the defined leap month rules and recurrence rules.
 */
export function calculateOccurrencesForYear(
    events: LunarEvent[],
    targetYear: number
): UpcomingEventOccurrence[] {
    const occurrences: UpcomingEventOccurrence[] = [];

    for (const event of events) {
        const { recurrence, lunarDate, lunarYear, leapMonthRule } = event;

        if (recurrence === RecurrenceRule.ONCE) {
            if (lunarYear !== targetYear) continue;
            addOccurrences(occurrences, event, targetYear, lunarDate, leapMonthRule);
        } else if (recurrence === RecurrenceRule.YEARLY) {
            addOccurrences(occurrences, event, targetYear, lunarDate, leapMonthRule);
        } else if (recurrence === RecurrenceRule.MONTHLY) {
            const ly = LunarYear.fromYear(targetYear);
            const months = ly.getMonths(); // Array of LunarMonth
            for (const lm of months) {
                const monthLunarDate: LunarDate = {
                    month: Math.abs(lm.getMonth()),
                    day: lunarDate.day
                };
                const isLeap = lm.isLeap();

                // For monthly recurrence, we need to handle if the day exists in this specific month
                const solar = convertLunarToSolar(targetYear, monthLunarDate, isLeap);
                if (solar) {
                    // Check leap rule filter
                    if (isLeap && (leapMonthRule === LeapMonthRule.REGULAR_ONLY)) continue;
                    if (!isLeap && (leapMonthRule === LeapMonthRule.LEAP_ONLY)) continue;

                    occurrences.push({
                        event,
                        solarDate: solar,
                        lunarContext: convertSolarToLunar(solar.year, solar.month, solar.day) || undefined,
                        isLeapMonthOccurrence: isLeap,
                        daysUntil: 0
                    });
                }
            }
        }
    }

    return occurrences;
}

function addOccurrences(
    occurrences: UpcomingEventOccurrence[],
    event: LunarEvent,
    targetYear: number,
    lunarDate: LunarDate,
    leapMonthRule: LeapMonthRule
) {
    // Try standard calculation (isLeapMonthEntry = false)
    const standardSolar = convertLunarToSolar(targetYear, lunarDate, false);

    // Try leap-month calculation (isLeapMonthEntry = true)
    const leapSolar = convertLunarToSolar(targetYear, lunarDate, true);

    // In REGULAR_ONLY rule, ONLY surface standard solar (if it exists)
    if ((leapMonthRule === LeapMonthRule.REGULAR_ONLY || leapMonthRule === LeapMonthRule.BOTH) && standardSolar) {
        occurrences.push({
            event,
            solarDate: standardSolar,
            lunarContext: convertSolarToLunar(standardSolar.year, standardSolar.month, standardSolar.day) || undefined,
            isLeapMonthOccurrence: false,
            daysUntil: 0
        });
    }

    // In LEAP_ONLY rule, ONLY surface leap solar (if it exists)
    if ((leapMonthRule === LeapMonthRule.LEAP_ONLY || leapMonthRule === LeapMonthRule.BOTH) && leapSolar) {
        occurrences.push({
            event,
            solarDate: leapSolar,
            lunarContext: convertSolarToLunar(leapSolar.year, leapSolar.month, leapSolar.day) || undefined,
            isLeapMonthOccurrence: true,
            daysUntil: 0
        });
    }
}

export { getUpcomingEvents } from '../application/queries/upcoming';
export { importEvents } from '../application/sync/import';
export { generateExportPayload, validateImportPayload } from '../application/sync/export';
export { addEvent, updateEvent, removeEvent } from '../application/events/crud';
export { validateEventCreationParams } from '../core/rules/leap-month';
export { LeapMonthRule, RecurrenceRule } from '../core/models/types';
export type { LunarEvent, LunarDate, SolarDate, UpcomingEventOccurrence, ExportPayload, LunarDateContext } from '../core/models/types';

import { LunarEvent, UpcomingEventOccurrence, LeapMonthRule } from '../core/models/types';
import { convertLunarToSolar, convertSolarToLunar } from '../core/lunar-math/converter';
export { convertLunarToSolar, convertSolarToLunar };
export * from './formatters';

/**
 * Validates constraints around Leap Month behavior (US2) and computes the valid
 * targeted solar dates according to exactly the defined leap month rules.
 */
export function calculateOccurrencesForYear(
    events: LunarEvent[],
    targetYear: number
): UpcomingEventOccurrence[] {
    const occurrences: UpcomingEventOccurrence[] = [];

    for (const event of events) {
        const { lunarDate, leapMonthRule } = event;

        // Try standard calculation (isLeapMonthEntry = false)
        const standardSolar = convertLunarToSolar(targetYear, lunarDate, false);

        // Try leap-month calculation (isLeapMonthEntry = true)
        const leapSolar = convertLunarToSolar(targetYear, lunarDate, true);

        // In REGULAR_ONLY rule, ONLY surface standard solar (if it exists)
        if (leapMonthRule === LeapMonthRule.REGULAR_ONLY && standardSolar) {
            occurrences.push({
                event,
                solarDate: standardSolar,
                lunarContext: convertSolarToLunar(standardSolar.year, standardSolar.month, standardSolar.day) || undefined,
                isLeapMonthOccurrence: false,
                daysUntil: 0
            });
        }

        // In LEAP_ONLY rule, ONLY surface leap solar (if it exists)
        if (leapMonthRule === LeapMonthRule.LEAP_ONLY && leapSolar) {
            occurrences.push({
                event,
                solarDate: leapSolar,
                lunarContext: convertSolarToLunar(leapSolar.year, leapSolar.month, leapSolar.day) || undefined,
                isLeapMonthOccurrence: true,
                daysUntil: 0
            });
        }

        // In BOTH rule, surface both if they exist, or whichever exists
        if (leapMonthRule === LeapMonthRule.BOTH) {
            if (standardSolar) {
                occurrences.push({
                    event,
                    solarDate: standardSolar,
                    lunarContext: convertSolarToLunar(standardSolar.year, standardSolar.month, standardSolar.day) || undefined,
                    isLeapMonthOccurrence: false,
                    daysUntil: 0
                });
            }
            if (leapSolar) {
                occurrences.push({
                    event,
                    solarDate: leapSolar,
                    lunarContext: convertSolarToLunar(leapSolar.year, leapSolar.month, leapSolar.day) || undefined,
                    isLeapMonthOccurrence: true,
                    daysUntil: 0
                });
            }
        }
    }

    return occurrences;
}

export { getUpcomingEvents } from '../application/queries/upcoming';
export { importEvents } from '../application/sync/import';
export { generateExportPayload, validateImportPayload } from '../application/sync/export';
export { addEvent, updateEvent, removeEvent } from '../application/events/crud';
export { validateEventCreationParams } from '../core/rules/leap-month';
export { LeapMonthRule } from '../core/models/types';
export type { LunarEvent, LunarDate, SolarDate, UpcomingEventOccurrence, ExportPayload, LunarDateContext } from '../core/models/types';

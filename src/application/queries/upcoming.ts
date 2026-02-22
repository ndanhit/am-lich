import { LunarEvent, UpcomingEventOccurrence, SolarDate } from '../../core/models/types';
import { calculateOccurrencesForYear } from '../../lib/index';

/**
 * Helper to convert our generic SolarDate type into a JS timestamp easily mapped for Math
 */
function solarDateToTimestamp(solar: SolarDate): number {
    return new Date(solar.year, solar.month - 1, solar.day).getTime();
}

/**
 * Given a list of user events, sorts and filters to find the N strictly upcoming 
 * occurrences by rolling through the requested target year into the next.
 */
export function getUpcomingEvents(
    events: LunarEvent[],
    referenceSolar: SolarDate,
    limit: number
): UpcomingEventOccurrence[] {

    if (events.length === 0) return [];

    const referenceTimestamp = solarDateToTimestamp(referenceSolar);

    // Grab occurrences for current calendar year
    const currentYearOccurrences = calculateOccurrencesForYear(events, referenceSolar.year);

    // Grab occurrences for next calendar year to handle cross-boundary limits
    const nextYearOccurrences = calculateOccurrencesForYear(events, referenceSolar.year + 1);

    const allCandidateOccurrences = [...currentYearOccurrences, ...nextYearOccurrences];

    // Filter, calculate daysUntil, and sort
    const validUpcoming = allCandidateOccurrences
        .map(occurrence => {
            const occTimestamp = solarDateToTimestamp(occurrence.solarDate);
            // Rough calculation of days difference avoiding timezones
            const daysUntil = Math.round((occTimestamp - referenceTimestamp) / (1000 * 60 * 60 * 24));

            return {
                ...occurrence,
                daysUntil
            };
        })
        .filter(occurrence => occurrence.daysUntil >= 0) // Keep today and future
        .sort((a, b) => a.daysUntil - b.daysUntil);

    return validUpcoming.slice(0, limit);
}

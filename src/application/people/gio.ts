import type {
  Person,
  LunarEvent,
  SolarDate,
  UpcomingEventOccurrence,
} from "../../core/models/types";
import { RecurrenceRule, LeapMonthRule } from "../../core/models/types";
import { convertSolarToLunar } from "../../core/lunar-math/converter";
import { getUpcomingEvents } from "../queries/upcoming";

/**
 * Build synthetic yearly lunar events ("giỗ") from deceased people who have a
 * complete death date. The event id mirrors the person id so callers can map
 * occurrences back to people.
 */
export function buildGioEvents(people: Person[]): LunarEvent[] {
  const events: LunarEvent[] = [];
  for (const p of people) {
    let month: number | null = null;
    let day: number | null = null;
    if (p.deathLunar && p.deathLunar.month != null && p.deathLunar.day != null) {
      // Preferred: the lunar anniversary entered directly by the user.
      month = p.deathLunar.month;
      day = p.deathLunar.day;
    } else if (p.deathDate && p.deathDate.month != null && p.deathDate.day != null) {
      // Legacy data: derive the lunar anniversary from the solar death date.
      const lunar = convertSolarToLunar(
        p.deathDate.year,
        p.deathDate.month,
        p.deathDate.day,
      );
      if (lunar) {
        month = Math.abs(lunar.lunarMonth);
        day = lunar.lunarDay;
      }
    }
    if (month == null || day == null) continue;
    events.push({
      id: p.id,
      name: `Giỗ ${p.name}`,
      lunarDate: { day, month },
      recurrence: RecurrenceRule.YEARLY,
      leapMonthRule: LeapMonthRule.REGULAR_ONLY,
      createdAt: p.createdAt,
      updatedAt: p.updatedAt,
    });
  }
  return events;
}

export type GioOccurrence = {
  person: Person;
  occurrence: UpcomingEventOccurrence;
};

/**
 * Upcoming giỗ for a set of people, sorted by how soon they are (reusing the
 * tested upcoming-events engine over synthetic giỗ events).
 */
export function getUpcomingGio(
  people: Person[],
  today: SolarDate,
  limit: number,
): GioOccurrence[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  return getUpcomingEvents(buildGioEvents(people), today, limit)
    .map((occurrence) => ({
      person: byId.get(occurrence.event.id)!,
      occurrence,
    }))
    .filter((g) => g.person != null);
}

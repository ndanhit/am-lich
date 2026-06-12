import {
  LunarEvent,
  ExportPayload,
  ExportSettings,
  LeapMonthRule,
  RecurrenceRule,
  QuickMemo,
  Person,
  SolarDate,
} from "../../core/models/types";
import { validateEventCreationParams } from "../../core/rules/leap-month";
import { isValidGender } from "../people/crud";

/**
 * Validates a JSON string as a compatible ExportPayload structure.
 * Strips unknown fields mapping carefully to bounded pure LunarEvent arrays.
 */
export function validateImportPayload(jsonPayload: string): ExportPayload {
  let raw: any;
  try {
    raw = JSON.parse(jsonPayload);
  } catch {
    throw new Error("Invalid JSON payload");
  }

  if (!raw || typeof raw !== "object") {
    throw new Error("Payload must be a JSON object");
  }

  if (raw.version !== 1) {
    throw new Error(`Unsupported payload version: ${raw.version}`);
  }

  if (typeof raw.exportedAt !== "number") {
    throw new Error("Missing or invalid exportedAt timestamp");
  }

  if (!Array.isArray(raw.events)) {
    throw new Error("Payload events must be an array");
  }

  // Map strictly to discard malicious or garbage keys
  const validatedEvents: LunarEvent[] = raw.events.map((e: any) => {
    if (!e.id || typeof e.id !== "string") throw new Error("Invalid event ID");
    if (!e.name || typeof e.name !== "string")
      throw new Error("Invalid event name");
    if (
      !e.lunarDate ||
      typeof e.lunarDate.day !== "number" ||
      typeof e.lunarDate.month !== "number"
    ) {
      throw new Error("Invalid event lunarDate");
    }
    if (typeof e.createdAt !== "number" || typeof e.updatedAt !== "number") {
      throw new Error("Invalid event timestamps");
    }

    const leapRule = e.leapMonthRule as LeapMonthRule;
    const recurrenceRule = e.recurrence as RecurrenceRule || RecurrenceRule.YEARLY; // Default to ONE_TIME/YEARLY if missing in older exports, but ideally it should be there.

    // Use standard domain bounds check
    validateEventCreationParams(e.lunarDate, leapRule);

    return {
      id: e.id,
      name: e.name,
      lunarDate: { day: e.lunarDate.day, month: e.lunarDate.month },
      lunarYear: e.lunarYear,
      recurrence: recurrenceRule,
      leapMonthRule: leapRule,
      createdAt: e.createdAt,
      updatedAt: e.updatedAt,
    };
  });

  // Optional memos field — older v1 exports won't have it
  let validatedMemos: QuickMemo[] | undefined;
  if (raw.memos !== undefined) {
    if (!Array.isArray(raw.memos)) {
      throw new Error("Payload memos must be an array");
    }
    validatedMemos = raw.memos.map((m: any) => {
      if (!m.id || typeof m.id !== "string") throw new Error("Invalid memo ID");
      if (typeof m.title !== "string") throw new Error("Invalid memo title");
      if (typeof m.note !== "string") throw new Error("Invalid memo note");
      if (
        !m.solarDate ||
        typeof m.solarDate.year !== "number" ||
        typeof m.solarDate.month !== "number" ||
        typeof m.solarDate.day !== "number"
      ) {
        throw new Error("Invalid memo solarDate");
      }
      if (typeof m.createdAt !== "number" || typeof m.updatedAt !== "number") {
        throw new Error("Invalid memo timestamps");
      }
      return {
        id: m.id,
        title: m.title,
        note: m.note,
        solarDate: {
          year: m.solarDate.year,
          month: m.solarDate.month,
          day: m.solarDate.day,
        },
        createdAt: m.createdAt,
        updatedAt: m.updatedAt,
      };
    });
  }

  // Optional people (gia phả) field — older exports won't have it
  let validatedPeople: Person[] | undefined;
  if (raw.people !== undefined) {
    if (!Array.isArray(raw.people)) {
      throw new Error("Payload people must be an array");
    }
    validatedPeople = raw.people.map((p: any) => {
      if (!p.id || typeof p.id !== "string")
        throw new Error("Invalid person ID");
      if (!p.name || typeof p.name !== "string")
        throw new Error("Invalid person name");
      if (!isValidGender(p.gender)) throw new Error("Invalid person gender");
      const birthDate = parseOptionalSolarDate(p.birthDate, "birthDate");
      const deathDate = parseOptionalSolarDate(p.deathDate, "deathDate");
      if (p.parentId !== null && typeof p.parentId !== "string")
        throw new Error("Invalid person parentId");
      if (p.spouseId !== null && typeof p.spouseId !== "string")
        throw new Error("Invalid person spouseId");
      if (typeof p.notes !== "string") throw new Error("Invalid person notes");
      if (typeof p.createdAt !== "number" || typeof p.updatedAt !== "number") {
        throw new Error("Invalid person timestamps");
      }
      // Backward-compat: older exports infer deceased status from deathDate,
      // and default married-in flag to false (blood-line) when absent.
      const isDeceased =
        typeof p.isDeceased === "boolean" ? p.isDeceased : deathDate !== null;
      const isMarriedIn =
        typeof p.isMarriedIn === "boolean" ? p.isMarriedIn : false;
      return {
        id: p.id,
        name: p.name,
        gender: p.gender,
        birthDate,
        isDeceased,
        deathDate,
        isMarriedIn,
        parentId: p.parentId,
        spouseId: p.spouseId,
        notes: p.notes,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });
  }

  // Optional settings — only present in newer exports
  let validatedSettings: ExportSettings | undefined;
  if (raw.settings !== undefined) {
    if (typeof raw.settings !== "object" || raw.settings === null) {
      throw new Error("Payload settings must be an object");
    }
    if (raw.settings.hiddenSystemEventIds !== undefined) {
      if (!Array.isArray(raw.settings.hiddenSystemEventIds)) {
        throw new Error("settings.hiddenSystemEventIds must be an array");
      }
      const ids = raw.settings.hiddenSystemEventIds.filter(
        (id: unknown): id is string => typeof id === "string",
      );
      validatedSettings = { hiddenSystemEventIds: ids };
    } else {
      validatedSettings = {};
    }
  }

  return {
    version: 1,
    exportedAt: raw.exportedAt,
    events: validatedEvents,
    ...(validatedMemos !== undefined ? { memos: validatedMemos } : {}),
    ...(validatedPeople !== undefined ? { people: validatedPeople } : {}),
    ...(validatedSettings !== undefined ? { settings: validatedSettings } : {}),
  };
}

/**
 * Parse an optional SolarDate from import payload. Accepts null/undefined
 * (returns null) or a well-formed { year, month, day }. Throws otherwise.
 */
function parseOptionalSolarDate(
  value: any,
  label: string,
): SolarDate | null {
  if (value === null || value === undefined) return null;
  if (
    typeof value !== "object" ||
    typeof value.year !== "number" ||
    typeof value.month !== "number" ||
    typeof value.day !== "number"
  ) {
    throw new Error(`Invalid person ${label}`);
  }
  return { year: value.year, month: value.month, day: value.day };
}

/**
 * Generates an offline compliant JSON payload for backup.
 * Memos and settings are optional — when present they round-trip through import.
 */
export function generateExportPayload(
  events: LunarEvent[],
  memos?: QuickMemo[],
  hiddenSystemEventIds?: string[],
  people?: Person[],
): ExportPayload {
  const settings: ExportSettings | undefined =
    hiddenSystemEventIds && hiddenSystemEventIds.length > 0
      ? { hiddenSystemEventIds: [...hiddenSystemEventIds] }
      : undefined;

  return {
    version: 1,
    exportedAt: Date.now(),
    events,
    ...(memos !== undefined ? { memos } : {}),
    ...(people !== undefined ? { people } : {}),
    ...(settings !== undefined ? { settings } : {}),
  };
}

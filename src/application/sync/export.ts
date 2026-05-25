import {
  LunarEvent,
  ExportPayload,
  LeapMonthRule,
  RecurrenceRule,
  QuickMemo,
} from "../../core/models/types";
import { validateEventCreationParams } from "../../core/rules/leap-month";

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

  return {
    version: 1,
    exportedAt: raw.exportedAt,
    events: validatedEvents,
    ...(validatedMemos !== undefined ? { memos: validatedMemos } : {}),
  };
}

/**
 * Generates an offline compliant JSON payload for backup.
 * Memos are optional — when present they round-trip through import.
 */
export function generateExportPayload(
  events: LunarEvent[],
  memos?: QuickMemo[],
): ExportPayload {
  return {
    version: 1,
    exportedAt: Date.now(),
    events,
    ...(memos !== undefined ? { memos } : {}),
  };
}

import {
  LunarEvent,
  ExportPayload,
  ExportSettings,
  LeapMonthRule,
  RecurrenceRule,
  QuickMemo,
  Person,
  PartialDate,
  FamilyTree,
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
      const birthDate = parsePartialDate(p.birthDate, "birthDate");
      const deathDate = parsePartialDate(p.deathDate, "deathDate");
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
      // Backward-compat: people without a treeId are migrated on import.
      const treeId = typeof p.treeId === "string" ? p.treeId : "";
      const order = typeof p.order === "number" ? p.order : 0;
      const str = (v: unknown): string => (typeof v === "string" ? v : "");
      return {
        id: p.id,
        treeId,
        name: p.name,
        gender: p.gender,
        birthDate,
        isDeceased,
        deathDate,
        isMarriedIn,
        parentId: p.parentId,
        spouseId: p.spouseId,
        order,
        aliasName: str(p.aliasName),
        altNames: str(p.altNames),
        homeland: str(p.homeland),
        burialPlace: str(p.burialPlace),
        titles: str(p.titles),
        notes: p.notes,
        createdAt: p.createdAt,
        updatedAt: p.updatedAt,
      };
    });
  }

  // Optional families (gia phả containers) — older exports won't have them
  let validatedFamilies: FamilyTree[] | undefined;
  if (raw.families !== undefined) {
    if (!Array.isArray(raw.families)) {
      throw new Error("Payload families must be an array");
    }
    validatedFamilies = raw.families.map((f: any) => {
      if (!f.id || typeof f.id !== "string")
        throw new Error("Invalid family ID");
      if (!f.name || typeof f.name !== "string")
        throw new Error("Invalid family name");
      if (typeof f.createdAt !== "number" || typeof f.updatedAt !== "number") {
        throw new Error("Invalid family timestamps");
      }
      return {
        id: f.id,
        name: f.name,
        description: typeof f.description === "string" ? f.description : "",
        createdAt: f.createdAt,
        updatedAt: f.updatedAt,
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
    ...(validatedFamilies !== undefined ? { families: validatedFamilies } : {}),
    ...(validatedSettings !== undefined ? { settings: validatedSettings } : {}),
  };
}

/**
 * Parse an optional PartialDate from import payload. Accepts null/undefined
 * (returns null), or an object with numeric `year` and numeric-or-null
 * `month`/`day`. Full {year,month,day} from older exports parses unchanged.
 */
function parsePartialDate(value: any, label: string): PartialDate | null {
  if (value === null || value === undefined) return null;
  if (typeof value !== "object" || typeof value.year !== "number") {
    throw new Error(`Invalid person ${label}`);
  }
  const month = typeof value.month === "number" ? value.month : null;
  const day = typeof value.day === "number" ? value.day : null;
  return { year: value.year, month, day };
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
  families?: FamilyTree[],
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
    ...(families !== undefined ? { families } : {}),
    ...(settings !== undefined ? { settings } : {}),
  };
}

import { describe, it, expect } from "vitest";
import {
  generateExportPayload,
  validateImportPayload,
} from "../../src/application/sync/export";
import {
  LeapMonthRule,
  RecurrenceRule,
} from "../../src/core/models/types";
import type {
  LunarEvent,
  QuickMemo,
} from "../../src/core/models/types";

const sampleEvent: LunarEvent = {
  id: "e1",
  name: "Giỗ",
  lunarDate: { day: 1, month: 5 },
  recurrence: RecurrenceRule.YEARLY,
  leapMonthRule: LeapMonthRule.REGULAR_ONLY,
  createdAt: 0,
  updatedAt: 0,
};

const sampleMemo: QuickMemo = {
  id: "m1",
  title: "Vệ sinh điều hoà",
  note: "phòng ngủ",
  solarDate: { year: 2026, month: 5, day: 28 },
  createdAt: 1,
  updatedAt: 1,
};

describe("generateExportPayload — memos and settings", () => {
  it("omits optional fields when not provided", () => {
    const payload = generateExportPayload([sampleEvent]);
    expect(payload.memos).toBeUndefined();
    expect(payload.settings).toBeUndefined();
  });

  it("includes memos when array passed", () => {
    const payload = generateExportPayload([sampleEvent], [sampleMemo]);
    expect(payload.memos).toEqual([sampleMemo]);
  });

  it("includes settings.hiddenSystemEventIds when ids provided", () => {
    const payload = generateExportPayload([], undefined, ["system:a", "system:b"]);
    expect(payload.settings?.hiddenSystemEventIds).toEqual([
      "system:a",
      "system:b",
    ]);
  });

  it("omits settings when hiddenSystemEventIds is empty array", () => {
    const payload = generateExportPayload([], [], []);
    expect(payload.settings).toBeUndefined();
  });
});

describe("validateImportPayload — memos", () => {
  function payloadJson(extras: Record<string, any> = {}) {
    return JSON.stringify({
      version: 1,
      exportedAt: 123,
      events: [],
      ...extras,
    });
  }

  it("accepts payload without memos field (backward compat)", () => {
    const parsed = validateImportPayload(payloadJson());
    expect(parsed.memos).toBeUndefined();
  });

  it("accepts payload with valid memos array", () => {
    const parsed = validateImportPayload(payloadJson({ memos: [sampleMemo] }));
    expect(parsed.memos).toEqual([sampleMemo]);
  });

  it("rejects memos when not an array", () => {
    expect(() =>
      validateImportPayload(payloadJson({ memos: "not array" })),
    ).toThrow(/memos must be an array/);
  });

  it("rejects memo with missing id", () => {
    expect(() =>
      validateImportPayload(
        payloadJson({ memos: [{ ...sampleMemo, id: undefined }] }),
      ),
    ).toThrow(/memo ID/);
  });

  it("rejects memo with non-string title", () => {
    expect(() =>
      validateImportPayload(
        payloadJson({ memos: [{ ...sampleMemo, title: 42 }] }),
      ),
    ).toThrow(/memo title/);
  });

  it("rejects memo with non-string note", () => {
    expect(() =>
      validateImportPayload(
        payloadJson({ memos: [{ ...sampleMemo, note: null }] }),
      ),
    ).toThrow(/memo note/);
  });

  it("rejects memo with missing solarDate fields", () => {
    expect(() =>
      validateImportPayload(
        payloadJson({
          memos: [{ ...sampleMemo, solarDate: { year: 2026, month: 5 } }],
        }),
      ),
    ).toThrow(/solarDate/);
  });

  it("rejects memo with non-numeric timestamps", () => {
    expect(() =>
      validateImportPayload(
        payloadJson({ memos: [{ ...sampleMemo, createdAt: "now" }] }),
      ),
    ).toThrow(/timestamps/);
  });
});

describe("validateImportPayload — settings", () => {
  function payloadJson(settings: any) {
    return JSON.stringify({
      version: 1,
      exportedAt: 123,
      events: [],
      settings,
    });
  }

  it("accepts payload with valid settings", () => {
    const parsed = validateImportPayload(
      payloadJson({ hiddenSystemEventIds: ["system:tet-nguyen-dan"] }),
    );
    expect(parsed.settings?.hiddenSystemEventIds).toEqual([
      "system:tet-nguyen-dan",
    ]);
  });

  it("accepts empty settings object (legacy)", () => {
    const parsed = validateImportPayload(payloadJson({}));
    expect(parsed.settings).toEqual({});
  });

  it("rejects non-object settings", () => {
    expect(() => validateImportPayload(payloadJson("oops"))).toThrow(
      /settings must be an object/,
    );
  });

  it("rejects settings.hiddenSystemEventIds when not array", () => {
    expect(() =>
      validateImportPayload(payloadJson({ hiddenSystemEventIds: "x" })),
    ).toThrow(/must be an array/);
  });

  it("filters non-string entries from hiddenSystemEventIds", () => {
    const parsed = validateImportPayload(
      payloadJson({ hiddenSystemEventIds: ["ok", 42, "another"] }),
    );
    expect(parsed.settings?.hiddenSystemEventIds).toEqual(["ok", "another"]);
  });
});

describe("validateImportPayload — toplevel errors", () => {
  it("rejects non-object root", () => {
    expect(() => validateImportPayload(JSON.stringify("string"))).toThrow(
      /JSON object/,
    );
  });

  it("rejects missing exportedAt", () => {
    expect(() =>
      validateImportPayload(JSON.stringify({ version: 1, events: [] })),
    ).toThrow(/exportedAt/);
  });

  it("rejects events that is not an array", () => {
    expect(() =>
      validateImportPayload(
        JSON.stringify({ version: 1, exportedAt: 1, events: {} }),
      ),
    ).toThrow(/events must be an array/);
  });

  it("rejects event with missing required fields", () => {
    expect(() =>
      validateImportPayload(
        JSON.stringify({
          version: 1,
          exportedAt: 1,
          events: [{ name: "no id" }],
        }),
      ),
    ).toThrow(/event ID/);
  });

  it("rejects event with invalid timestamps", () => {
    expect(() =>
      validateImportPayload(
        JSON.stringify({
          version: 1,
          exportedAt: 1,
          events: [
            {
              id: "x",
              name: "y",
              lunarDate: { day: 1, month: 1 },
              leapMonthRule: LeapMonthRule.REGULAR_ONLY,
              createdAt: "bad",
              updatedAt: 0,
            },
          ],
        }),
      ),
    ).toThrow(/timestamps/);
  });
});

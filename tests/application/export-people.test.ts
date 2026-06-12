import { describe, it, expect } from "vitest";
import {
  generateExportPayload,
  validateImportPayload,
} from "../../src/application/sync/export";
import type { Person, LunarEvent } from "../../src/core/models/types";

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "p1",
    name: "Nguyễn Văn A",
    gender: "male",
    birthDate: { year: 1950, month: 3, day: 12 },
    deathDate: null,
    parentId: null,
    spouseId: null,
    notes: "Ghi chú",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

const baseEvent: LunarEvent[] = [];

describe("generateExportPayload with people", () => {
  it("omits people when not provided", () => {
    const payload = generateExportPayload(baseEvent);
    expect(payload.people).toBeUndefined();
  });

  it("includes people when provided", () => {
    const payload = generateExportPayload(baseEvent, undefined, undefined, [
      person(),
    ]);
    expect(payload.people).toHaveLength(1);
    expect(payload.people![0].name).toBe("Nguyễn Văn A");
  });

  it("includes an empty people array when provided as empty", () => {
    const payload = generateExportPayload(baseEvent, undefined, undefined, []);
    expect(payload.people).toEqual([]);
  });
});

describe("validateImportPayload with people", () => {
  function payloadJson(people: unknown): string {
    return JSON.stringify({ version: 1, exportedAt: 123, events: [], people });
  }

  it("parses valid people round-trip", () => {
    const json = payloadJson([
      person({ deathDate: { year: 2020, month: 1, day: 1 } }),
    ]);
    const parsed = validateImportPayload(json);
    expect(parsed.people).toHaveLength(1);
    expect(parsed.people![0].birthDate).toEqual({
      year: 1950,
      month: 3,
      day: 12,
    });
    expect(parsed.people![0].deathDate).toEqual({
      year: 2020,
      month: 1,
      day: 1,
    });
  });

  it("accepts null birth/death dates", () => {
    const json = payloadJson([person({ birthDate: null, deathDate: null })]);
    const parsed = validateImportPayload(json);
    expect(parsed.people![0].birthDate).toBeNull();
    expect(parsed.people![0].deathDate).toBeNull();
  });

  it("is backward-compatible when people field is absent", () => {
    const json = JSON.stringify({ version: 1, exportedAt: 123, events: [] });
    const parsed = validateImportPayload(json);
    expect(parsed.people).toBeUndefined();
  });

  it("rejects non-array people", () => {
    expect(() => validateImportPayload(payloadJson({}))).toThrow(
      /people must be an array/,
    );
  });

  it("rejects invalid gender", () => {
    const json = payloadJson([{ ...person(), gender: "robot" }]);
    expect(() => validateImportPayload(json)).toThrow(/gender/);
  });

  it("rejects malformed birthDate shape", () => {
    const json = payloadJson([{ ...person(), birthDate: { year: 2000 } }]);
    expect(() => validateImportPayload(json)).toThrow(/birthDate/);
  });

  it("rejects missing name", () => {
    const json = payloadJson([{ ...person(), name: "" }]);
    expect(() => validateImportPayload(json)).toThrow(/name/);
  });

  it("rejects invalid parentId type", () => {
    const json = payloadJson([{ ...person(), parentId: 42 }]);
    expect(() => validateImportPayload(json)).toThrow(/parentId/);
  });

  it("strips garbage extra keys but keeps valid fields", () => {
    const json = payloadJson([{ ...person(), evil: "<script>" }]);
    const parsed = validateImportPayload(json);
    expect((parsed.people![0] as any).evil).toBeUndefined();
    expect(parsed.people![0].id).toBe("p1");
  });
});

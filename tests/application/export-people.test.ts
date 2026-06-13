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
    isDeceased: false,
    deathDate: null,
    treeId: "t1",
    isMarriedIn: false,
    order: 0,
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

  it("includes families when provided", () => {
    const fam = {
      id: "f1",
      name: "Họ Nguyễn",
      description: "gốc Bắc",
      createdAt: 1,
      updatedAt: 1,
    };
    const payload = generateExportPayload(
      baseEvent,
      undefined,
      undefined,
      undefined,
      [fam],
    );
    expect(payload.families).toEqual([fam]);
  });
});

describe("validateImportPayload with families & person.treeId", () => {
  it("round-trips families and person treeId", () => {
    const json = JSON.stringify({
      version: 1,
      exportedAt: 1,
      events: [],
      families: [
        { id: "f1", name: "Họ Nguyễn", description: "d", createdAt: 1, updatedAt: 1 },
      ],
      people: [{ ...person({ treeId: "f1" }) }],
    });
    const parsed = validateImportPayload(json);
    expect(parsed.families).toHaveLength(1);
    expect(parsed.families![0].name).toBe("Họ Nguyễn");
    expect(parsed.people![0].treeId).toBe("f1");
  });

  it("defaults person treeId to empty string when missing (backward-compat)", () => {
    const json = JSON.stringify({
      version: 1,
      exportedAt: 1,
      events: [],
      people: [{ ...person(), treeId: undefined }],
    });
    expect(validateImportPayload(json).people![0].treeId).toBe("");
  });

  it("rejects a family without a name", () => {
    const json = JSON.stringify({
      version: 1,
      exportedAt: 1,
      events: [],
      families: [{ id: "f1", createdAt: 1, updatedAt: 1 }],
    });
    expect(() => validateImportPayload(json)).toThrow(/family name/);
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

  it("round-trips isDeceased=true with no death date", () => {
    const json = payloadJson([
      person({ isDeceased: true, deathDate: null }),
    ]);
    const parsed = validateImportPayload(json);
    expect(parsed.people![0].isDeceased).toBe(true);
    expect(parsed.people![0].deathDate).toBeNull();
  });

  it("round-trips sibling order and defaults to 0 when missing", () => {
    const withOrder = payloadJson([person({ order: 3 })]);
    expect(validateImportPayload(withOrder).people![0].order).toBe(3);

    const legacy = payloadJson([{ ...person(), order: undefined }]);
    expect(validateImportPayload(legacy).people![0].order).toBe(0);
  });

  it("round-trips isMarriedIn and defaults to false when missing", () => {
    const married = payloadJson([person({ isMarriedIn: true })]);
    expect(validateImportPayload(married).people![0].isMarriedIn).toBe(true);

    const legacy = payloadJson([{ ...person(), isMarriedIn: undefined }]);
    expect(validateImportPayload(legacy).people![0].isMarriedIn).toBe(false);
  });

  it("infers isDeceased from deathDate when flag is missing (old export)", () => {
    const withDeath = payloadJson([
      { ...person({ deathDate: { year: 2000, month: 1, day: 1 } }), isDeceased: undefined },
    ]);
    expect(validateImportPayload(withDeath).people![0].isDeceased).toBe(true);

    const withoutDeath = payloadJson([
      { ...person({ deathDate: null }), isDeceased: undefined },
    ]);
    expect(validateImportPayload(withoutDeath).people![0].isDeceased).toBe(false);
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

  it("rejects birthDate without a numeric year", () => {
    const json = payloadJson([{ ...person(), birthDate: { month: 3 } }]);
    expect(() => validateImportPayload(json)).toThrow(/birthDate/);
  });

  it("accepts a year-only partial birthDate", () => {
    const json = payloadJson([{ ...person(), birthDate: { year: 1950 } }]);
    const parsed = validateImportPayload(json);
    expect(parsed.people![0].birthDate).toEqual({
      year: 1950,
      month: null,
      day: null,
    });
  });

  it("round-trips a year+month partial date (day null)", () => {
    const json = payloadJson([
      person({ birthDate: { year: 1950, month: 3, day: null } }),
    ]);
    expect(validateImportPayload(json).people![0].birthDate).toEqual({
      year: 1950,
      month: 3,
      day: null,
    });
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

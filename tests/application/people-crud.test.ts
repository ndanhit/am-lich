import { describe, it, expect } from "vitest";
import {
  addPerson,
  updatePerson,
  removePerson,
  importPeople,
  validatePersonCreationParams,
  isValidGender,
} from "../../src/application/people/crud";
import type { Person } from "../../src/core/models/types";

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "p1",
    name: "Nguyễn Văn A",
    gender: "male",
    birthDate: null,
    isDeceased: false,
    deathDate: null,
    isMarriedIn: false,
    parentId: null,
    spouseId: null,
    notes: "",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("addPerson", () => {
  it("appends a new person immutably", () => {
    const before = [person({ id: "a" })];
    const after = addPerson(before, person({ id: "b" }));
    expect(after).toHaveLength(2);
    expect(before).toHaveLength(1);
    expect(after).not.toBe(before);
  });

  it("throws on duplicate id", () => {
    expect(() => addPerson([person({ id: "x" })], person({ id: "x" }))).toThrow(
      /already exists/,
    );
  });
});

describe("updatePerson", () => {
  it("replaces the matching person immutably", () => {
    const before = [person({ id: "a", name: "old" })];
    const after = updatePerson(before, person({ id: "a", name: "new" }));
    expect(after[0].name).toBe("new");
    expect(before[0].name).toBe("old");
  });

  it("throws when id not found", () => {
    expect(() =>
      updatePerson([person({ id: "a" })], person({ id: "missing" })),
    ).toThrow(/not found/);
  });
});

describe("removePerson", () => {
  it("filters out the person by id", () => {
    const a = person({ id: "a" });
    const b = person({ id: "b" });
    const after = removePerson([a, b], "a");
    expect(after.map((p) => p.id)).toEqual(["b"]);
  });

  it("resets dangling parentId references to null and bumps updatedAt", () => {
    const parent = person({ id: "parent" });
    const child = person({ id: "child", parentId: "parent", updatedAt: 5 });
    const after = removePerson([parent, child], "parent");
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe("child");
    expect(after[0].parentId).toBeNull();
    expect(after[0].updatedAt).toBeGreaterThanOrEqual(5);
  });

  it("resets dangling spouseId references to null", () => {
    const husband = person({ id: "h", spouseId: "w" });
    const wife = person({ id: "w", spouseId: "h" });
    const after = removePerson([husband, wife], "h");
    expect(after).toHaveLength(1);
    expect(after[0].id).toBe("w");
    expect(after[0].spouseId).toBeNull();
  });

  it("leaves unrelated people untouched (same reference)", () => {
    const a = person({ id: "a" });
    const b = person({ id: "b" });
    const after = removePerson([a, b], "a");
    expect(after[0]).toBe(b);
  });
});

describe("importPeople (merge by updatedAt)", () => {
  it("adds new people by id", () => {
    const local = [person({ id: "a", updatedAt: 1 })];
    const imported = [person({ id: "b", updatedAt: 2 })];
    const merged = importPeople(local, imported);
    expect(merged.map((p) => p.id).sort()).toEqual(["a", "b"]);
  });

  it("overwrites local with strictly newer imported", () => {
    const local = [person({ id: "a", name: "old", updatedAt: 1 })];
    const imported = [person({ id: "a", name: "new", updatedAt: 2 })];
    expect(importPeople(local, imported)[0].name).toBe("new");
  });

  it("keeps local when imported is older or equal", () => {
    const local = [person({ id: "a", name: "local", updatedAt: 2 })];
    const equal = [person({ id: "a", name: "imported", updatedAt: 2 })];
    expect(importPeople(local, equal)[0].name).toBe("local");
    const older = [person({ id: "a", name: "imported", updatedAt: 1 })];
    expect(importPeople(local, older)[0].name).toBe("local");
  });
});

describe("validatePersonCreationParams", () => {
  it("accepts a valid name with null dates", () => {
    expect(() =>
      validatePersonCreationParams("Nguyễn Văn A", null, null),
    ).not.toThrow();
  });

  it("rejects empty / whitespace name", () => {
    expect(() => validatePersonCreationParams("", null, null)).toThrow(/Tên/);
    expect(() => validatePersonCreationParams("   ", null, null)).toThrow(/Tên/);
  });

  it("rejects out-of-range birth year", () => {
    expect(() =>
      validatePersonCreationParams("A", { year: 1900, month: 1, day: 1 }, null),
    ).toThrow(/Năm sinh/);
    expect(() =>
      validatePersonCreationParams("A", { year: 2100, month: 1, day: 1 }, null),
    ).toThrow(/Năm sinh/);
  });

  it("rejects invalid birth month / day", () => {
    expect(() =>
      validatePersonCreationParams("A", { year: 2000, month: 13, day: 1 }, null),
    ).toThrow(/Tháng sinh/);
    expect(() =>
      validatePersonCreationParams("A", { year: 2000, month: 1, day: 32 }, null),
    ).toThrow(/Ngày sinh/);
  });

  it("rejects non-existent date (Feb 30)", () => {
    expect(() =>
      validatePersonCreationParams("A", { year: 2000, month: 2, day: 30 }, null),
    ).toThrow(/không tồn tại/);
  });

  it("accepts Feb 29 in a leap year", () => {
    expect(() =>
      validatePersonCreationParams("A", { year: 2024, month: 2, day: 29 }, null),
    ).not.toThrow();
  });

  it("rejects Feb 29 in a non-leap year (death date)", () => {
    expect(() =>
      validatePersonCreationParams("A", null, { year: 2025, month: 2, day: 29 }),
    ).toThrow(/không tồn tại/);
  });

  it("rejects death date earlier than birth date", () => {
    expect(() =>
      validatePersonCreationParams(
        "A",
        { year: 1950, month: 6, day: 1 },
        { year: 1940, month: 6, day: 1 },
      ),
    ).toThrow(/Ngày mất không thể trước ngày sinh/);
  });

  it("accepts death date on the same day as birth date", () => {
    expect(() =>
      validatePersonCreationParams(
        "A",
        { year: 1950, month: 6, day: 1 },
        { year: 1950, month: 6, day: 1 },
      ),
    ).not.toThrow();
  });

  it("accepts a year-only partial date", () => {
    expect(() =>
      validatePersonCreationParams("A", { year: 1950, month: null, day: null }, null),
    ).not.toThrow();
  });

  it("accepts a year+month partial date", () => {
    expect(() =>
      validatePersonCreationParams("A", { year: 1950, month: 3, day: null }, null),
    ).not.toThrow();
  });

  it("rejects a day without a month", () => {
    expect(() =>
      validatePersonCreationParams("A", { year: 1950, month: null, day: 5 }, null),
    ).toThrow(/Tháng sinh/);
  });

  it("rejects death before birth when only years are known", () => {
    expect(() =>
      validatePersonCreationParams(
        "A",
        { year: 1950, month: null, day: null },
        { year: 1940, month: null, day: null },
      ),
    ).toThrow(/Ngày mất không thể trước ngày sinh/);
  });

  it("allows partial dates whose comparable parts are unknown", () => {
    // Same year, death month unknown → cannot prove it's earlier.
    expect(() =>
      validatePersonCreationParams(
        "A",
        { year: 1950, month: 6, day: null },
        { year: 1950, month: null, day: null },
      ),
    ).not.toThrow();
  });
});

describe("isValidGender", () => {
  it("accepts the three known genders", () => {
    expect(isValidGender("male")).toBe(true);
    expect(isValidGender("female")).toBe(true);
    expect(isValidGender("other")).toBe(true);
  });

  it("rejects unknown values", () => {
    expect(isValidGender("alien")).toBe(false);
    expect(isValidGender(42)).toBe(false);
    expect(isValidGender(null)).toBe(false);
  });
});

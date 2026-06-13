import { describe, it, expect } from "vitest";
import { buildPhaKy } from "../../../src/application/sharing/phaky";
import type { Person } from "../../../src/core/models/types";

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "p1",
    treeId: "f1",
    name: "Người",
    gender: "male",
    birthDate: null,
    isDeceased: false,
    deathDate: null,
    isMarriedIn: false,
    parentId: null,
    spouseId: null,
    order: 0,
    aliasName: "",
    altNames: "",
    homeland: "",
    burialPlace: "",
    titles: "",
    notes: "",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("buildPhaKy", () => {
  it("groups blood members by generation, ordered by sibling order", () => {
    const root = person({ id: "r", name: "Ông Tổ" });
    const c2 = person({ id: "c2", name: "Con Hai", parentId: "r", order: 1 });
    const c1 = person({ id: "c1", name: "Con Một", parentId: "r", order: 0 });
    const g1 = person({ id: "g1", name: "Cháu", parentId: "c1", order: 0 });

    const entries = buildPhaKy([root, c2, c1, g1]);

    expect(entries.map((e) => e.person.id)).toEqual(["r", "c1", "c2", "g1"]);
    expect(entries.map((e) => e.generation)).toEqual([1, 2, 2, 3]);
  });

  it("resolves parent and spouse names, excludes married-in as entries", () => {
    const root = person({ id: "r", name: "Ông Tổ", spouseId: "w" });
    const wife = person({
      id: "w",
      name: "Bà Tổ",
      gender: "female",
      isMarriedIn: true,
      spouseId: "r",
    });
    const child = person({ id: "c", name: "Con", parentId: "r", order: 0 });

    const entries = buildPhaKy([root, wife, child]);

    // wife is married-in → not a standalone entry
    expect(entries.map((e) => e.person.id)).toEqual(["r", "c"]);
    expect(entries[0].spouseName).toBe("Bà Tổ");
    expect(entries[0].parentName).toBe(null);
    expect(entries[1].parentName).toBe("Ông Tổ");
    expect(entries[1].spouseName).toBe(null);
  });

  it("is cycle-safe and handles empty input", () => {
    expect(buildPhaKy([])).toEqual([]);
    const a = person({ id: "a", parentId: "b" });
    const b = person({ id: "b", parentId: "a" });
    expect(() => buildPhaKy([a, b])).not.toThrow();
  });
});

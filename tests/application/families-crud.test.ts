import { describe, it, expect } from "vitest";
import {
  addFamily,
  updateFamily,
  removeFamily,
  removeTreePeople,
  importFamilies,
  validateFamilyParams,
  migratePeople,
} from "../../src/application/families/crud";
import type { FamilyTree, Person } from "../../src/core/models/types";

function family(overrides: Partial<FamilyTree> = {}): FamilyTree {
  return {
    id: "f1",
    name: "Họ Nguyễn",
    description: "",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

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
    order: 0,
    parentId: null,
    spouseId: null,
    notes: "",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("family CRUD", () => {
  it("addFamily appends immutably and rejects duplicate id", () => {
    const before = [family({ id: "a" })];
    const after = addFamily(before, family({ id: "b" }));
    expect(after).toHaveLength(2);
    expect(before).toHaveLength(1);
    expect(() => addFamily(after, family({ id: "a" }))).toThrow(/already exists/);
  });

  it("updateFamily replaces / throws when missing", () => {
    const before = [family({ id: "a", name: "old" })];
    expect(updateFamily(before, family({ id: "a", name: "new" }))[0].name).toBe(
      "new",
    );
    expect(() => updateFamily(before, family({ id: "x" }))).toThrow(/not found/);
  });

  it("removeFamily filters by id", () => {
    const after = removeFamily([family({ id: "a" }), family({ id: "b" })], "a");
    expect(after.map((f) => f.id)).toEqual(["b"]);
  });

  it("removeTreePeople drops people of the deleted tree only", () => {
    const people = [
      person({ id: "1", treeId: "a" }),
      person({ id: "2", treeId: "b" }),
      person({ id: "3", treeId: "a" }),
    ];
    expect(removeTreePeople(people, "a").map((p) => p.id)).toEqual(["2"]);
  });

  it("importFamilies merges by updatedAt", () => {
    const local = [family({ id: "a", name: "local", updatedAt: 2 })];
    const newer = [family({ id: "a", name: "imported", updatedAt: 3 })];
    expect(importFamilies(local, newer)[0].name).toBe("imported");
    const older = [family({ id: "a", name: "imported", updatedAt: 1 })];
    expect(importFamilies(local, older)[0].name).toBe("local");
  });

  it("validateFamilyParams rejects an empty name", () => {
    expect(() => validateFamilyParams("")).toThrow(/Tên gia phả/);
    expect(() => validateFamilyParams("  ")).toThrow(/Tên gia phả/);
    expect(() => validateFamilyParams("OK")).not.toThrow();
  });
});

describe("migratePeople", () => {
  const makeDefault = (): FamilyTree => family({ id: "default", name: "Mặc định" });

  it("does nothing when everyone already has a treeId", () => {
    const people = [person({ id: "1", treeId: "f1" })];
    const families = [family({ id: "f1" })];
    const res = migratePeople(people, families, makeDefault);
    expect(res.changed).toBe(false);
    expect(res.people).toBe(people);
  });

  it("creates a default tree when none exists and assigns orphans", () => {
    const people = [person({ id: "1", treeId: "" })];
    const res = migratePeople(people, [], makeDefault);
    expect(res.changed).toBe(true);
    expect(res.families).toHaveLength(1);
    expect(res.families[0].id).toBe("default");
    expect(res.people[0].treeId).toBe("default");
  });

  it("assigns orphans to the first existing tree", () => {
    const people = [
      person({ id: "1", treeId: "" }),
      person({ id: "2", treeId: "keep" }),
    ];
    const families = [family({ id: "existing" })];
    const res = migratePeople(people, families, makeDefault);
    expect(res.families).toHaveLength(1);
    expect(res.people[0].treeId).toBe("existing");
    expect(res.people[1].treeId).toBe("keep"); // untouched
  });
});

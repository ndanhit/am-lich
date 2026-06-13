import { describe, it, expect } from "vitest";
import { buildFamilySnapshot } from "../../../src/application/sharing/snapshot";
import type { FamilyTree, Person } from "../../../src/core/models/types";

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
    parentId: null,
    spouseId: null,
    order: 0,
    aliasName: "",
    altNames: "",
    homeland: "",
    burialPlace: "Làng A",
    titles: "",
    notes: "Bí mật",
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("buildFamilySnapshot", () => {
  it("includes only people of that family", () => {
    const people = [
      person({ id: "a", treeId: "f1" }),
      person({ id: "b", treeId: "other" }),
      person({ id: "c", treeId: "f1" }),
    ];
    const snap = buildFamilySnapshot(family(), people);
    expect(snap.version).toBe(1);
    expect(snap.family.id).toBe("f1");
    expect(snap.people.map((p) => p.id).sort()).toEqual(["a", "c"]);
  });

  it("keeps sensitive fields by default", () => {
    const snap = buildFamilySnapshot(family(), [person({ id: "a" })]);
    expect(snap.people[0].notes).toBe("Bí mật");
    expect(snap.people[0].burialPlace).toBe("Làng A");
  });

  it("strips notes & burial place when hideSensitive is set", () => {
    const snap = buildFamilySnapshot(family(), [person({ id: "a" })], {
      hideSensitive: true,
    });
    expect(snap.people[0].notes).toBe("");
    expect(snap.people[0].burialPlace).toBe("");
    // non-sensitive fields preserved
    expect(snap.people[0].name).toBe("Người");
  });
});

import { describe, it, expect } from "vitest";
import {
  reorderSiblings,
  ensureSiblingOrder,
  nextSiblingOrder,
} from "../../src/application/people/ordering";
import type { Person } from "../../src/core/models/types";

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "p1",
    treeId: "t1",
    name: "Người",
    gender: "male",
    birthDate: null,
    isDeceased: false,
    deathDate: null,
    isMarriedIn: false,
    parentId: "parent",
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

describe("reorderSiblings", () => {
  it("assigns order by position and only touches listed children", () => {
    const a = person({ id: "a", order: 0 });
    const b = person({ id: "b", order: 1 });
    const c = person({ id: "c", order: 2 });
    const other = person({ id: "x", parentId: "another", order: 5 });
    const after = reorderSiblings([a, b, c, other], "parent", ["c", "a", "b"]);
    const byId = new Map(after.map((p) => [p.id, p]));
    expect(byId.get("c")!.order).toBe(0);
    expect(byId.get("a")!.order).toBe(1);
    expect(byId.get("b")!.order).toBe(2);
    expect(byId.get("x")!.order).toBe(5); // untouched
    expect(byId.get("x")).toBe(other); // same reference
  });

  it("is immutable", () => {
    const a = person({ id: "a", order: 0 });
    const before = [a];
    reorderSiblings(before, "parent", ["a"]);
    expect(before[0].order).toBe(0);
  });
});

describe("nextSiblingOrder", () => {
  it("returns max sibling order + 1", () => {
    const people = [
      person({ id: "a", order: 0 }),
      person({ id: "b", order: 1 }),
      person({ id: "c", parentId: "other", order: 9 }),
    ];
    expect(nextSiblingOrder(people, "t1", "parent")).toBe(2);
  });

  it("returns 0 when there are no siblings", () => {
    expect(nextSiblingOrder([], "t1", "parent")).toBe(0);
  });

  it("ignores married-in people", () => {
    const people = [person({ id: "a", order: 3, isMarriedIn: true })];
    expect(nextSiblingOrder(people, "t1", "parent")).toBe(0);
  });
});

describe("ensureSiblingOrder", () => {
  it("does nothing when everyone already has a numeric order", () => {
    const people = [person({ id: "a", order: 0 })];
    const res = ensureSiblingOrder(people);
    expect(res.changed).toBe(false);
    expect(res.people).toBe(people);
  });

  it("assigns order per parent group sorted by birth", () => {
    const younger = person({
      id: "y",
      birthDate: { year: 2000, month: 1, day: 1 },
    });
    const older = person({
      id: "o",
      birthDate: { year: 1990, month: 1, day: 1 },
    });
    // strip order to simulate legacy data
    delete (younger as any).order;
    delete (older as any).order;
    const res = ensureSiblingOrder([younger, older]);
    expect(res.changed).toBe(true);
    const byId = new Map(res.people.map((p) => [p.id, p]));
    expect(byId.get("o")!.order).toBe(0); // older first
    expect(byId.get("y")!.order).toBe(1);
  });

  it("orders separate parent groups independently", () => {
    const a1 = person({ id: "a1", parentId: "A" });
    const a2 = person({ id: "a2", parentId: "A" });
    const b1 = person({ id: "b1", parentId: "B" });
    [a1, a2, b1].forEach((p) => delete (p as any).order);
    const res = ensureSiblingOrder([a1, a2, b1]);
    const byId = new Map(res.people.map((p) => [p.id, p]));
    expect(byId.get("b1")!.order).toBe(0); // first in its own group
  });
});

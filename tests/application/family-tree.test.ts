import { describe, it, expect } from "vitest";
import {
  buildFamilyTree,
  getDescendantIds,
} from "../../src/application/people/tree";
import type { Person, SolarDate } from "../../src/core/models/types";

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "p1",
    name: "Person",
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

function birth(year: number): SolarDate {
  return { year, month: 1, day: 1 };
}

describe("buildFamilyTree", () => {
  it("returns [] for empty input", () => {
    expect(buildFamilyTree([])).toEqual([]);
  });

  it("excludes married-in spouses from the structural tree", () => {
    const head = person({ id: "head" });
    const wife = person({ id: "wife", isMarriedIn: true, spouseId: "head" });
    const roots = buildFamilyTree([head, wife]);
    expect(roots).toHaveLength(1);
    expect(roots[0].person.id).toBe("head");
  });

  it("treats parentId=null people as roots", () => {
    const a = person({ id: "a" });
    const b = person({ id: "b" });
    const roots = buildFamilyTree([a, b]);
    expect(roots.map((n) => n.person.id).sort()).toEqual(["a", "b"]);
    expect(roots.every((n) => n.depth === 0)).toBe(true);
  });

  it("nests children under their parent with increasing depth", () => {
    const grandpa = person({ id: "g" });
    const dad = person({ id: "d", parentId: "g" });
    const kid = person({ id: "k", parentId: "d" });
    const roots = buildFamilyTree([grandpa, dad, kid]);

    expect(roots).toHaveLength(1);
    expect(roots[0].person.id).toBe("g");
    expect(roots[0].depth).toBe(0);

    const dadNode = roots[0].children[0];
    expect(dadNode.person.id).toBe("d");
    expect(dadNode.depth).toBe(1);

    const kidNode = dadNode.children[0];
    expect(kidNode.person.id).toBe("k");
    expect(kidNode.depth).toBe(2);
  });

  it("treats a dangling parentId as a root", () => {
    const orphan = person({ id: "o", parentId: "ghost" });
    const roots = buildFamilyTree([orphan]);
    expect(roots).toHaveLength(1);
    expect(roots[0].person.id).toBe("o");
  });

  it("does not loop forever on a 2-cycle and keeps both people", () => {
    const a = person({ id: "a", parentId: "b" });
    const b = person({ id: "b", parentId: "a" });
    const roots = buildFamilyTree([a, b]);
    // Pure cycle has no root via parent links; both are promoted as roots.
    const ids = collectIds(roots);
    expect(ids.sort()).toEqual(["a", "b"]);
  });

  it("sorts siblings by birthDate ascending, unknown birth last", () => {
    const parent = person({ id: "p" });
    const younger = person({ id: "younger", parentId: "p", birthDate: birth(2010) });
    const older = person({ id: "older", parentId: "p", birthDate: birth(1990) });
    const unknown = person({ id: "unknown", parentId: "p", birthDate: null });
    const roots = buildFamilyTree([parent, younger, older, unknown]);
    const childIds = roots[0].children.map((c) => c.person.id);
    expect(childIds).toEqual(["older", "younger", "unknown"]);
  });

  it("sorts roots by birthDate ascending", () => {
    const a = person({ id: "a", birthDate: birth(1980) });
    const b = person({ id: "b", birthDate: birth(1950) });
    const roots = buildFamilyTree([a, b]);
    expect(roots.map((n) => n.person.id)).toEqual(["b", "a"]);
  });

  it("sorts siblings by partial birth dates (year, then month, then day)", () => {
    const parent = person({ id: "p" });
    const sameYearLater = person({
      id: "y2",
      parentId: "p",
      birthDate: { year: 1950, month: 9, day: 1 },
    });
    const sameYearEarlier = person({
      id: "y1",
      parentId: "p",
      birthDate: { year: 1950, month: 2, day: 1 },
    });
    const yearOnly = person({
      id: "yo",
      parentId: "p",
      birthDate: { year: 1950, month: null, day: null },
    });
    const earlierYear = person({
      id: "older",
      parentId: "p",
      birthDate: { year: 1948, month: null, day: null },
    });
    const roots = buildFamilyTree([
      parent,
      sameYearLater,
      yearOnly,
      sameYearEarlier,
      earlierYear,
    ]);
    // 1948 first; then within 1950: Feb, Sep, then unknown-month last.
    expect(roots[0].children.map((c) => c.person.id)).toEqual([
      "older",
      "y1",
      "y2",
      "yo",
    ]);
  });
});

describe("getDescendantIds", () => {
  it("returns all descendants but not the person itself", () => {
    const g = person({ id: "g" });
    const d = person({ id: "d", parentId: "g" });
    const k = person({ id: "k", parentId: "d" });
    const sibling = person({ id: "s", parentId: "g" });
    const ids = getDescendantIds([g, d, k, sibling], "g");
    expect([...ids].sort()).toEqual(["d", "k", "s"]);
    expect(ids.has("g")).toBe(false);
  });

  it("returns empty set for a leaf node", () => {
    const g = person({ id: "g" });
    const d = person({ id: "d", parentId: "g" });
    expect(getDescendantIds([g, d], "d").size).toBe(0);
  });

  it("is cycle-safe", () => {
    const a = person({ id: "a", parentId: "b" });
    const b = person({ id: "b", parentId: "a" });
    // Should terminate; descendants of a include b (and back to a, deduped out).
    const ids = getDescendantIds([a, b], "a");
    expect(ids.has("b")).toBe(true);
  });
});

function collectIds(
  nodes: { person: Person; children: any[] }[],
): string[] {
  const ids: string[] = [];
  for (const n of nodes) {
    ids.push(n.person.id);
    ids.push(...collectIds(n.children));
  }
  return ids;
}

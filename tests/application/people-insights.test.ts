import { describe, it, expect } from "vitest";
import { computeBranchInsights } from "../../src/application/people/insights";
import type { Person } from "../../src/core/models/types";

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "p1",
    name: "Người",
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

/**
 * Fixture: a 3-generation branch.
 *   g (gốc, nam) ⚭ gw (vợ gốc, dâu của đời trên — KHÔNG tính ở đây)
 *   ├─ son (nam) ⚭ sonWife (dâu)
 *   │   └─ grandkid (nữ)
 *   └─ daughter (nữ) ⚭ dHusband (rể)
 */
function fixture(): Person[] {
  return [
    person({ id: "g", gender: "male", spouseId: "gw" }),
    person({ id: "gw", gender: "female", isMarriedIn: true, spouseId: "g" }),
    person({ id: "son", gender: "male", parentId: "g", spouseId: "sonWife" }),
    person({
      id: "sonWife",
      gender: "female",
      isMarriedIn: true,
      spouseId: "son",
    }),
    person({ id: "grandkid", gender: "female", parentId: "son" }),
    person({ id: "daughter", gender: "female", parentId: "g", spouseId: "dHusband" }),
    person({
      id: "dHusband",
      gender: "male",
      isMarriedIn: true,
      spouseId: "daughter",
    }),
  ];
}

describe("computeBranchInsights", () => {
  it("counts generations, descendants and direct children", () => {
    const s = computeBranchInsights(fixture(), "g");
    expect(s.generations).toBe(3); // g → son/daughter → grandkid
    expect(s.descendants).toBe(3); // son, daughter, grandkid
    expect(s.directChildren).toBe(2); // son, daughter
  });

  it("breaks descendants down by gender", () => {
    const s = computeBranchInsights(fixture(), "g");
    expect(s.maleDescendants).toBe(1); // son
    expect(s.femaleDescendants).toBe(2); // daughter, grandkid
    expect(s.otherDescendants).toBe(0);
  });

  it("counts dâu/rể of descendants, excluding the root's own spouse", () => {
    const s = computeBranchInsights(fixture(), "g");
    expect(s.daughtersInLaw).toBe(1); // sonWife
    expect(s.sonsInLaw).toBe(1); // dHusband
  });

  it("counts total members (blood + dâu/rể, incl. root + root's spouse)", () => {
    const s = computeBranchInsights(fixture(), "g");
    // g, gw, son, sonWife, grandkid, daughter, dHusband = 7
    expect(s.totalMembers).toBe(7);
  });

  it("reports a sub-branch from an intermediate person", () => {
    const s = computeBranchInsights(fixture(), "son");
    expect(s.generations).toBe(2); // son → grandkid
    expect(s.descendants).toBe(1); // grandkid
    expect(s.directChildren).toBe(1);
    expect(s.daughtersInLaw).toBe(0); // grandkid has no spouse
  });

  it("returns an empty branch for a leaf person", () => {
    const s = computeBranchInsights(fixture(), "grandkid");
    expect(s.descendants).toBe(0);
    expect(s.generations).toBe(1);
    expect(s.directChildren).toBe(0);
  });

  it("is safe when the id does not exist", () => {
    const s = computeBranchInsights(fixture(), "ghost");
    expect(s.descendants).toBe(0);
    expect(s.totalMembers).toBe(0);
  });
});

import { describe, it, expect } from "vitest";
import {
  attachChild,
  attachSpouse,
  attachParent,
  removePersonCascade,
} from "../../src/application/people/relations";
import type { Person } from "../../src/core/models/types";

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "p1",
    name: "Người",
    gender: "male",
    birthDate: null,
    isDeceased: false,
    deathDate: null,
    treeId: "t1",
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

describe("attachChild", () => {
  it("attaches a blood child under the parent", () => {
    const parent = person({ id: "parent" });
    const child = person({ id: "child", parentId: "ignored", isMarriedIn: true });
    const after = attachChild([parent], "parent", child);
    const stored = after.find((p) => p.id === "child")!;
    expect(stored.parentId).toBe("parent");
    expect(stored.isMarriedIn).toBe(false);
  });

  it("throws when parent not found", () => {
    expect(() => attachChild([], "ghost", person({ id: "c" }))).toThrow(
      /Không tìm thấy/,
    );
  });

  it("throws when the parent is a married-in person", () => {
    const inlaw = person({ id: "inlaw", isMarriedIn: true });
    expect(() => attachChild([inlaw], "inlaw", person({ id: "c" }))).toThrow(
      /nhánh chính/,
    );
  });
});

describe("attachSpouse", () => {
  it("links both partners and marks the new one as married-in", () => {
    const head = person({ id: "head", gender: "male" });
    const wife = person({ id: "wife", gender: "female" });
    const after = attachSpouse([head], "head", wife);
    const storedHead = after.find((p) => p.id === "head")!;
    const storedWife = after.find((p) => p.id === "wife")!;
    expect(storedHead.spouseId).toBe("wife");
    expect(storedWife.spouseId).toBe("head");
    expect(storedWife.isMarriedIn).toBe(true);
    expect(storedWife.parentId).toBeNull();
  });

  it("throws when the person already has a spouse", () => {
    const head = person({ id: "head", spouseId: "existing" });
    expect(() => attachSpouse([head], "head", person({ id: "w" }))).toThrow(
      /đã có vợ\/chồng/,
    );
  });

  it("throws for gender 'other'", () => {
    const head = person({ id: "head", gender: "other" });
    expect(() => attachSpouse([head], "head", person({ id: "w" }))).toThrow(
      /không thể thêm vợ\/chồng/i,
    );
  });

  it("throws when target is a married-in person", () => {
    const inlaw = person({ id: "inlaw", isMarriedIn: true });
    expect(() => attachSpouse([inlaw], "inlaw", person({ id: "w" }))).toThrow(
      /dâu\/rể/,
    );
  });
});

describe("attachParent", () => {
  it("creates a parent above a root child", () => {
    const child = person({ id: "child" });
    const parent = person({ id: "parent" });
    const after = attachParent([child], "child", parent);
    expect(after.find((p) => p.id === "child")!.parentId).toBe("parent");
    expect(after.find((p) => p.id === "parent")!.parentId).toBeNull();
  });

  it("throws when the child already has a parent", () => {
    const child = person({ id: "child", parentId: "existing" });
    expect(() => attachParent([child], "child", person({ id: "p" }))).toThrow(
      /đã có cha\/mẹ/,
    );
  });
});

describe("removePersonCascade", () => {
  it("removes a married-in person and unlinks the partner", () => {
    const head = person({ id: "head", spouseId: "wife" });
    const wife = person({ id: "wife", isMarriedIn: true, spouseId: "head" });
    const after = removePersonCascade([head, wife], "wife");
    expect(after.map((p) => p.id)).toEqual(["head"]);
    expect(after[0].spouseId).toBeNull();
  });

  it("removes the whole blood subtree plus attached spouses", () => {
    const grandpa = person({ id: "g", spouseId: "gw" });
    const grandma = person({ id: "gw", isMarriedIn: true, spouseId: "g" });
    const dad = person({ id: "d", parentId: "g", spouseId: "dw" });
    const mom = person({ id: "dw", isMarriedIn: true, spouseId: "d" });
    const kid = person({ id: "k", parentId: "d" });
    const uncle = person({ id: "u", parentId: "g" });

    const after = removePersonCascade([grandpa, grandma, dad, mom, kid, uncle], "d");
    // dad + his wife + his child removed; grandpa/grandma/uncle remain.
    expect(after.map((p) => p.id).sort()).toEqual(["g", "gw", "u"]);
  });

  it("returns input unchanged when id not found", () => {
    const a = person({ id: "a" });
    expect(removePersonCascade([a], "missing")).toEqual([a]);
  });
});

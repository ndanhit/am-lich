import { describe, it, expect } from "vitest";
import {
  describeSuggestion,
  type SuggestionForm,
} from "../../../src/application/sharing/suggestion";
import type { Person } from "../../../src/core/models/types";

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "p1",
    treeId: "f1",
    name: "Nguyễn Văn A",
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

function form(name: string): SuggestionForm {
  return {
    name,
    gender: "male",
    birthDate: null,
    isDeceased: false,
    deathDate: null,
    aliasName: "",
    altNames: "",
    homeland: "",
    burialPlace: "",
    titles: "",
    notes: "",
  };
}

describe("describeSuggestion", () => {
  const byId = new Map([["p1", person({ id: "p1", name: "Ông A" })]]);

  it("describes an add_child suggestion", () => {
    expect(
      describeSuggestion(
        { kind: "add_child", targetId: "p1", form: form("Con B") },
        byId,
      ),
    ).toBe('Thêm con cho "Ông A": "Con B"');
  });

  it("describes an add_spouse / add_parent suggestion", () => {
    expect(
      describeSuggestion(
        { kind: "add_spouse", targetId: "p1", form: form("Bà C") },
        byId,
      ),
    ).toContain("Thêm vợ/chồng cho");
    expect(
      describeSuggestion(
        { kind: "add_parent", targetId: "p1", form: form("Cụ D") },
        byId,
      ),
    ).toContain("Thêm cha/mẹ cho");
  });

  it("describes an edit suggestion", () => {
    expect(
      describeSuggestion(
        { kind: "edit", targetId: "p1", form: form("Ông A (sửa)") },
        byId,
      ),
    ).toBe('Sửa thông tin "Ông A" → "Ông A (sửa)"');
  });

  it("handles unknown target gracefully", () => {
    expect(
      describeSuggestion(
        { kind: "add_child", targetId: "ghost", form: form("X") },
        byId,
      ),
    ).toContain("(không rõ)");
  });
});

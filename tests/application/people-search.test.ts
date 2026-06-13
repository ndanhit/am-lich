import { describe, it, expect } from "vitest";
import { searchPeople, normalizeText } from "../../src/application/people/search";
import type { Person } from "../../src/core/models/types";

function person(overrides: Partial<Person> = {}): Person {
  return {
    id: "p1",
    treeId: "t1",
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

describe("normalizeText", () => {
  it("strips Vietnamese diacritics and lowercases", () => {
    expect(normalizeText("Nguyễn Đức")).toBe("nguyen duc");
  });
});

describe("searchPeople", () => {
  const people = [
    person({ id: "a", name: "Nguyễn Văn An" }),
    person({ id: "b", name: "Trần Thị Bình", isDeceased: true }),
    person({ id: "c", name: "Lê Văn Cường", aliasName: "Cu Tí" }),
  ];

  it("matches by name accent-insensitively", () => {
    const r = searchPeople(people, { query: "nguyen", status: "all" });
    expect(r.map((p) => p.id)).toEqual(["a"]);
  });

  it("matches by alias name", () => {
    const r = searchPeople(people, { query: "cu ti", status: "all" });
    expect(r.map((p) => p.id)).toEqual(["c"]);
  });

  it("filters by living status", () => {
    expect(searchPeople(people, { query: "", status: "deceased" }).map((p) => p.id)).toEqual(["b"]);
    expect(
      searchPeople(people, { query: "", status: "alive" })
        .map((p) => p.id)
        .sort(),
    ).toEqual(["a", "c"]);
  });

  it("returns all (sorted by name) for an empty query", () => {
    const r = searchPeople(people, { query: "  ", status: "all" });
    expect(r).toHaveLength(3);
  });

  it("returns [] when nothing matches", () => {
    expect(searchPeople(people, { query: "xyz", status: "all" })).toEqual([]);
  });
});

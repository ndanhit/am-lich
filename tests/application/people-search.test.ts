import { describe, it, expect } from "vitest";
import {
  searchPeople,
  normalizeText,
  availableGenerations,
} from "../../src/application/people/search";
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
  // A blood line: An (đời 1) → Bình (đời 2) → Cường (đời 3).
  const people = [
    person({ id: "a", name: "Nguyễn Văn An" }),
    person({ id: "b", name: "Trần Thị Bình", parentId: "a" }),
    person({ id: "c", name: "Lê Văn Cường", aliasName: "Cu Tí", parentId: "b" }),
  ];

  it("matches by name accent-insensitively", () => {
    const r = searchPeople(people, { query: "nguyen", generation: "all" });
    expect(r.map((p) => p.id)).toEqual(["a"]);
  });

  it("matches by alias name", () => {
    const r = searchPeople(people, { query: "cu ti", generation: "all" });
    expect(r.map((p) => p.id)).toEqual(["c"]);
  });

  it("filters by generation (đời)", () => {
    expect(
      searchPeople(people, { query: "", generation: 1 }).map((p) => p.id),
    ).toEqual(["a"]);
    expect(
      searchPeople(people, { query: "", generation: 2 }).map((p) => p.id),
    ).toEqual(["b"]);
    expect(
      searchPeople(people, { query: "", generation: 3 }).map((p) => p.id),
    ).toEqual(["c"]);
  });

  it("combines a generation filter with a name query", () => {
    expect(
      searchPeople(people, { query: "binh", generation: 1 }),
    ).toEqual([]);
    expect(
      searchPeople(people, { query: "binh", generation: 2 }).map((p) => p.id),
    ).toEqual(["b"]);
  });

  it("returns all (sorted by name) for an empty query", () => {
    const r = searchPeople(people, { query: "  ", generation: "all" });
    expect(r).toHaveLength(3);
  });

  it("returns [] when nothing matches", () => {
    expect(searchPeople(people, { query: "xyz", generation: "all" })).toEqual(
      [],
    );
  });
});

describe("availableGenerations", () => {
  it("lists the distinct generations present, ascending", () => {
    const people = [
      person({ id: "a" }),
      person({ id: "b", parentId: "a" }),
      person({ id: "c", parentId: "b" }),
      person({ id: "d", parentId: "a" }),
    ];
    expect(availableGenerations(people)).toEqual([1, 2, 3]);
  });

  it("returns [] for no people", () => {
    expect(availableGenerations([])).toEqual([]);
  });
});

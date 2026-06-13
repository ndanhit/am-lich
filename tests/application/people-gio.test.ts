import { describe, it, expect } from "vitest";
import { buildGioEvents, getUpcomingGio } from "../../src/application/people/gio";
import { convertSolarToLunar } from "../../src/core/lunar-math/converter";
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

describe("buildGioEvents", () => {
  it("includes only deceased people with a complete death date", () => {
    const people = [
      person({ id: "full", isDeceased: true, deathDate: { year: 2000, month: 3, day: 10 } }),
      person({ id: "partial", isDeceased: true, deathDate: { year: 2000, month: null, day: null } }),
      person({ id: "alive" }),
    ];
    const events = buildGioEvents(people);
    expect(events.map((e) => e.id)).toEqual(["full"]);
    expect(events[0].name).toBe("Giỗ Người");
  });

  it("uses the lunar date of death", () => {
    const lunar = convertSolarToLunar(2000, 3, 10)!;
    const events = buildGioEvents([
      person({ id: "x", deathDate: { year: 2000, month: 3, day: 10 } }),
    ]);
    expect(events[0].lunarDate).toEqual({
      day: lunar.lunarDay,
      month: Math.abs(lunar.lunarMonth),
    });
  });
});

describe("getUpcomingGio", () => {
  it("returns upcoming giỗ mapped back to people, sorted by daysUntil", () => {
    const people = [
      person({ id: "a", name: "A", deathDate: { year: 1990, month: 1, day: 20 } }),
      person({ id: "b", name: "B", deathDate: { year: 1990, month: 8, day: 5 } }),
    ];
    const result = getUpcomingGio(people, { year: 2026, month: 6, day: 13 }, 50);
    expect(result.length).toBeGreaterThan(0);
    for (let i = 1; i < result.length; i++) {
      expect(result[i].occurrence.daysUntil).toBeGreaterThanOrEqual(
        result[i - 1].occurrence.daysUntil,
      );
    }
    expect(result.every((g) => g.person != null)).toBe(true);
  });

  it("returns [] when nobody has a giỗ", () => {
    expect(getUpcomingGio([person({ id: "alive" })], { year: 2026, month: 1, day: 1 }, 50)).toEqual([]);
  });
});

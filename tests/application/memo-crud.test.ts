import { describe, it, expect } from "vitest";
import {
  addMemo,
  updateMemo,
  removeMemo,
  importMemos,
  validateMemoCreationParams,
  groupMemosByTitle,
} from "../../src/application/memos/crud";
import type { QuickMemo } from "../../src/core/models/types";

function memo(overrides: Partial<QuickMemo> = {}): QuickMemo {
  return {
    id: "m1",
    title: "Test",
    note: "",
    solarDate: { year: 2026, month: 5, day: 1 },
    createdAt: 1,
    updatedAt: 1,
    ...overrides,
  };
}

describe("addMemo", () => {
  it("appends a new memo immutably", () => {
    const a = memo({ id: "a" });
    const b = memo({ id: "b" });
    const before = [a];
    const after = addMemo(before, b);
    expect(after).toHaveLength(2);
    expect(before).toHaveLength(1);
    expect(after).not.toBe(before);
  });

  it("throws on duplicate id", () => {
    const m = memo({ id: "x" });
    expect(() => addMemo([m], memo({ id: "x" }))).toThrow(/already exists/);
  });
});

describe("updateMemo", () => {
  it("replaces matching memo", () => {
    const before = [memo({ id: "a", title: "old" })];
    const after = updateMemo(before, memo({ id: "a", title: "new" }));
    expect(after[0].title).toBe("new");
    expect(before[0].title).toBe("old"); // immutable
  });

  it("throws when id not found", () => {
    expect(() => updateMemo([memo({ id: "a" })], memo({ id: "missing" }))).toThrow(
      /not found/,
    );
  });
});

describe("removeMemo", () => {
  it("filters out by id", () => {
    const a = memo({ id: "a" });
    const b = memo({ id: "b" });
    const after = removeMemo([a, b], "a");
    expect(after).toEqual([b]);
  });

  it("returns unchanged copy when id missing", () => {
    const a = memo({ id: "a" });
    const after = removeMemo([a], "missing");
    expect(after).toEqual([a]);
  });
});

describe("importMemos (merge by updatedAt)", () => {
  it("adds new memo by id", () => {
    const local = [memo({ id: "a", updatedAt: 1 })];
    const imported = [memo({ id: "b", updatedAt: 2 })];
    const merged = importMemos(local, imported);
    expect(merged).toHaveLength(2);
    expect(merged.map((m) => m.id).sort()).toEqual(["a", "b"]);
  });

  it("overwrites local with strictly newer imported", () => {
    const local = [memo({ id: "a", title: "old", updatedAt: 1 })];
    const imported = [memo({ id: "a", title: "new", updatedAt: 2 })];
    const merged = importMemos(local, imported);
    expect(merged[0].title).toBe("new");
  });

  it("keeps local when imported is older or equal", () => {
    const local = [memo({ id: "a", title: "local-v2", updatedAt: 2 })];
    const imported = [memo({ id: "a", title: "imported-v2", updatedAt: 2 })];
    expect(importMemos(local, imported)[0].title).toBe("local-v2");

    const olderImported = [memo({ id: "a", title: "imported-v1", updatedAt: 1 })];
    expect(importMemos(local, olderImported)[0].title).toBe("local-v2");
  });
});

describe("validateMemoCreationParams", () => {
  it("accepts valid params", () => {
    expect(() => validateMemoCreationParams("Hello", 2026, 5, 1)).not.toThrow();
  });

  it("rejects empty title", () => {
    expect(() => validateMemoCreationParams("", 2026, 5, 1)).toThrow(/Tiêu đề/);
    expect(() => validateMemoCreationParams("   ", 2026, 5, 1)).toThrow(/Tiêu đề/);
  });

  it("rejects out-of-range year", () => {
    expect(() => validateMemoCreationParams("x", 1900, 5, 1)).toThrow(/Năm/);
    expect(() => validateMemoCreationParams("x", 2100, 5, 1)).toThrow(/Năm/);
  });

  it("rejects invalid month", () => {
    expect(() => validateMemoCreationParams("x", 2026, 0, 1)).toThrow(/Tháng/);
    expect(() => validateMemoCreationParams("x", 2026, 13, 1)).toThrow(/Tháng/);
  });

  it("rejects invalid day", () => {
    expect(() => validateMemoCreationParams("x", 2026, 5, 0)).toThrow(/Ngày/);
    expect(() => validateMemoCreationParams("x", 2026, 5, 32)).toThrow(/Ngày/);
  });

  it("rejects non-existent calendar day (Feb 30)", () => {
    expect(() => validateMemoCreationParams("x", 2026, 2, 30)).toThrow(/không tồn tại/);
  });

  it("accepts Feb 29 in leap year", () => {
    expect(() => validateMemoCreationParams("x", 2024, 2, 29)).not.toThrow();
  });

  it("rejects Feb 29 in non-leap year", () => {
    expect(() => validateMemoCreationParams("x", 2025, 2, 29)).toThrow(/không tồn tại/);
  });

  it("rejects non-integer values", () => {
    expect(() => validateMemoCreationParams("x", 2026.5, 5, 1)).toThrow(/Năm/);
    expect(() => validateMemoCreationParams("x", 2026, 5.5, 1)).toThrow(/Tháng/);
    expect(() => validateMemoCreationParams("x", 2026, 5, 1.5)).toThrow(/Ngày/);
  });
});

describe("groupMemosByTitle", () => {
  it("returns empty array for empty input", () => {
    expect(groupMemosByTitle([])).toEqual([]);
  });

  it("groups by title (case-insensitive trim)", () => {
    const m1 = memo({ id: "1", title: " Vệ sinh điều hoà ", solarDate: { year: 2026, month: 5, day: 1 } });
    const m2 = memo({ id: "2", title: "vệ sinh điều hoà", solarDate: { year: 2026, month: 3, day: 1 } });
    const m3 = memo({ id: "3", title: "Thay lọc nước", solarDate: { year: 2026, month: 4, day: 1 } });

    const groups = groupMemosByTitle([m1, m2, m3]);
    expect(groups).toHaveLength(2);
    const acGroup = groups.find((g) => g.title.toLowerCase() === "vệ sinh điều hoà")!;
    expect(acGroup.memos).toHaveLength(2);
  });

  it("sorts memos within group by date desc", () => {
    const old = memo({ id: "old", title: "X", solarDate: { year: 2026, month: 1, day: 1 } });
    const newer = memo({ id: "new", title: "X", solarDate: { year: 2026, month: 6, day: 1 } });
    const groups = groupMemosByTitle([old, newer]);
    expect(groups[0].memos[0].id).toBe("new");
    expect(groups[0].memos[1].id).toBe("old");
  });

  it("sorts groups by their most recent memo date desc", () => {
    const old = memo({ id: "old", title: "A", solarDate: { year: 2024, month: 1, day: 1 } });
    const newer = memo({ id: "new", title: "B", solarDate: { year: 2026, month: 6, day: 1 } });
    const groups = groupMemosByTitle([old, newer]);
    expect(groups[0].title).toBe("B"); // most recent first
    expect(groups[1].title).toBe("A");
  });

  it("uses the most recent memo's original title casing for display", () => {
    const old = memo({ id: "1", title: "vệ sinh", solarDate: { year: 2026, month: 1, day: 1 } });
    const newer = memo({ id: "2", title: "Vệ Sinh", solarDate: { year: 2026, month: 6, day: 1 } });
    const groups = groupMemosByTitle([old, newer]);
    expect(groups[0].title).toBe("Vệ Sinh");
  });

  it("lastDate reflects most recent solar date", () => {
    const m1 = memo({ id: "1", title: "T", solarDate: { year: 2026, month: 1, day: 1 } });
    const m2 = memo({ id: "2", title: "T", solarDate: { year: 2026, month: 12, day: 31 } });
    const groups = groupMemosByTitle([m1, m2]);
    expect(groups[0].lastDate).toEqual({ year: 2026, month: 12, day: 31 });
  });

  it("compares dates by year, then month, then day", () => {
    const m1 = memo({ id: "1", title: "T", solarDate: { year: 2025, month: 12, day: 31 } });
    const m2 = memo({ id: "2", title: "T", solarDate: { year: 2026, month: 1, day: 1 } });
    const groups = groupMemosByTitle([m1, m2]);
    expect(groups[0].memos[0].id).toBe("2");
  });
});

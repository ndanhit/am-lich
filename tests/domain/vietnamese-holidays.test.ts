import { describe, it, expect } from "vitest";
import {
  VIETNAMESE_HOLIDAYS,
  isSystemEventId,
} from "../../src/core/system-events/vietnamese-holidays";
import {
  LeapMonthRule,
  RecurrenceRule,
} from "../../src/core/models/types";

describe("VIETNAMESE_HOLIDAYS", () => {
  it("contains 10 holidays", () => {
    expect(VIETNAMESE_HOLIDAYS).toHaveLength(10);
  });

  it("every holiday has system: id prefix", () => {
    for (const h of VIETNAMESE_HOLIDAYS) {
      expect(h.id.startsWith("system:")).toBe(true);
    }
  });

  it("all ids are unique", () => {
    const ids = VIETNAMESE_HOLIDAYS.map((h) => h.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("every holiday is YEARLY recurrence with REGULAR_ONLY leap rule", () => {
    for (const h of VIETNAMESE_HOLIDAYS) {
      expect(h.recurrence).toBe(RecurrenceRule.YEARLY);
      expect(h.leapMonthRule).toBe(LeapMonthRule.REGULAR_ONLY);
    }
  });

  it("uses sentinel 0 timestamps", () => {
    for (const h of VIETNAMESE_HOLIDAYS) {
      expect(h.createdAt).toBe(0);
      expect(h.updatedAt).toBe(0);
    }
  });

  it("lunarDate fields are within valid bounds", () => {
    for (const h of VIETNAMESE_HOLIDAYS) {
      expect(h.lunarDate.day).toBeGreaterThanOrEqual(1);
      expect(h.lunarDate.day).toBeLessThanOrEqual(30);
      expect(h.lunarDate.month).toBeGreaterThanOrEqual(1);
      expect(h.lunarDate.month).toBeLessThanOrEqual(12);
    }
  });

  it("includes Tết Nguyên Đán on 1/1 lunar", () => {
    const tet = VIETNAMESE_HOLIDAYS.find((h) => h.id === "system:tet-nguyen-dan");
    expect(tet).toBeDefined();
    expect(tet!.lunarDate).toEqual({ day: 1, month: 1 });
  });

  it("includes Tết Trung Thu on 15/8 lunar", () => {
    const trungThu = VIETNAMESE_HOLIDAYS.find(
      (h) => h.id === "system:tet-trung-thu",
    );
    expect(trungThu).toBeDefined();
    expect(trungThu!.lunarDate).toEqual({ day: 15, month: 8 });
  });
});

describe("isSystemEventId", () => {
  it("returns true for system: prefixed ids", () => {
    expect(isSystemEventId("system:tet-nguyen-dan")).toBe(true);
    expect(isSystemEventId("system:anything-else")).toBe(true);
  });

  it("returns false for user UUIDs and arbitrary strings", () => {
    expect(isSystemEventId("a-b-c-d-uuid")).toBe(false);
    expect(isSystemEventId("")).toBe(false);
    expect(isSystemEventId("system")).toBe(false);
  });
});

import { describe, it, expect } from "vitest";
import {
  formatSolarDate,
  formatLunarDate,
} from "../../src/lib/formatters";
import type { LunarDateContext } from "../../src/core/models/types";

describe("formatSolarDate", () => {
  it("formats with zero-padded day and month", () => {
    expect(formatSolarDate({ year: 2026, month: 5, day: 1 })).toBe("01/05/2026");
  });

  it("does not pad already 2-digit values", () => {
    expect(formatSolarDate({ year: 2026, month: 12, day: 31 })).toBe(
      "31/12/2026",
    );
  });

  it("handles single-digit month and day independently", () => {
    expect(formatSolarDate({ year: 2026, month: 7, day: 9 })).toBe("09/07/2026");
  });
});

describe("formatLunarDate", () => {
  const baseCtx: LunarDateContext = {
    lunarDay: 15,
    lunarMonth: 7,
    lunarYear: 2026,
    isLeapMonth: false,
    canChiYear: "Bính Ngọ",
    canChiMonth: "Ất Mùi",
    canChiDay: "Quý Tỵ",
    fateElement: "Lô Trung Hỏa",
    auspiciousHours: [],
    incompatibleAges: [],
  };

  it("formats without leap suffix when not a leap month", () => {
    expect(formatLunarDate(baseCtx)).toBe("Ngày 15 Tháng 7 năm Bính Ngọ");
  });

  it("appends (nhuận) when isLeapMonth is true", () => {
    expect(formatLunarDate({ ...baseCtx, isLeapMonth: true })).toBe(
      "Ngày 15 Tháng 7 (nhuận) năm Bính Ngọ",
    );
  });
});

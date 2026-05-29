import { describe, it, expect } from "vitest";
import { convertSolarToLunar } from "../../src/core/lunar-math/converter";

describe("convertSolarToLunar — LunarDateContext fields", () => {
  it("returns Vietnamese fateElement (NaYin) for 10/6/2026 = Đại Khê Thủy", () => {
    const ctx = convertSolarToLunar(2026, 6, 10);
    expect(ctx).not.toBeNull();
    expect(ctx!.fateElement).toBe("Đại Khê Thủy");
  });

  it("returns Vietnamese fateElement for 1/1/2024 = Hải Trung Kim", () => {
    const ctx = convertSolarToLunar(2024, 1, 1);
    expect(ctx).not.toBeNull();
    expect(ctx!.fateElement).toBe("Hải Trung Kim");
  });

  it("returns combined incompatibleAges as single string Gà (Kỷ Dậu) for 10/6/2026", () => {
    const ctx = convertSolarToLunar(2026, 6, 10);
    expect(ctx!.incompatibleAges).toEqual(["Gà (Kỷ Dậu)"]);
  });

  it("returns combined incompatibleAges Khỉ (Bính Thân) for 28/5/2026", () => {
    const ctx = convertSolarToLunar(2026, 5, 28);
    expect(ctx!.incompatibleAges).toEqual(["Khỉ (Bính Thân)"]);
  });

  it("auspiciousHours are Vietnamese Chi names only", () => {
    const ctx = convertSolarToLunar(2026, 6, 10);
    expect(ctx!.auspiciousHours.length).toBeGreaterThan(0);
    // Each item should be a Vietnamese Chi name (Tý, Sửu, Dần, Mão, etc.)
    const validChi = [
      "Tý",
      "Sửu",
      "Dần",
      "Mão",
      "Thìn",
      "Tỵ",
      "Ngọ",
      "Mùi",
      "Thân",
      "Dậu",
      "Tuất",
      "Hợi",
    ];
    for (const h of ctx!.auspiciousHours) {
      expect(validChi).toContain(h);
    }
  });

  it("isLeapMonth is true when the lunar month is leap", () => {
    // 2028 has leap month 5; solar 2028-07-07 falls in it
    const ctx = convertSolarToLunar(2028, 7, 7);
    expect(ctx!.isLeapMonth).toBe(true);
  });
});

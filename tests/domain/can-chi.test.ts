import { describe, it, expect } from "vitest";
import { translateGanZhiToVietnamese } from "../../src/core/models/can-chi";

describe("translateGanZhiToVietnamese", () => {
  it("returns empty/falsy input unchanged", () => {
    expect(translateGanZhiToVietnamese("")).toBe("");
  });

  describe("2-char GanZhi pairs", () => {
    it("translates Giáp Tý", () => {
      expect(translateGanZhiToVietnamese("甲子")).toBe("Giáp Tý");
    });

    it("translates Kỷ Dậu", () => {
      expect(translateGanZhiToVietnamese("己酉")).toBe("Kỷ Dậu");
    });

    it("translates Bính Ngọ", () => {
      expect(translateGanZhiToVietnamese("丙午")).toBe("Bính Ngọ");
    });

    it("returns the raw 2-char when one half is unknown", () => {
      expect(translateGanZhiToVietnamese("甲x")).toBe("甲x");
    });
  });

  describe("single chars", () => {
    it("translates a single Can", () => {
      expect(translateGanZhiToVietnamese("甲")).toBe("Giáp");
    });

    it("translates a single Chi", () => {
      expect(translateGanZhiToVietnamese("子")).toBe("Tý");
    });

    it("translates a zodiac animal", () => {
      expect(translateGanZhiToVietnamese("鸡")).toBe("Gà");
      expect(translateGanZhiToVietnamese("龙")).toBe("Rồng");
      expect(translateGanZhiToVietnamese("马")).toBe("Ngựa");
    });

    it("falls back to original char when unknown", () => {
      expect(translateGanZhiToVietnamese("X")).toBe("X");
    });
  });

  describe("NaYin (Five Elements)", () => {
    it("translates Đại Khê Thủy", () => {
      expect(translateGanZhiToVietnamese("大溪水")).toBe("Đại Khê Thủy");
    });

    it("translates Hải Trung Kim", () => {
      expect(translateGanZhiToVietnamese("海中金")).toBe("Hải Trung Kim");
    });

    it("translates Lô Trung Hỏa", () => {
      expect(translateGanZhiToVietnamese("炉中火")).toBe("Lô Trung Hỏa");
    });

    it("translates Kim Bạc Kim", () => {
      expect(translateGanZhiToVietnamese("金箔金")).toBe("Kim Bạc Kim");
    });

    it("translates Đại Hải Thủy", () => {
      expect(translateGanZhiToVietnamese("大海水")).toBe("Đại Hải Thủy");
    });

    it("returns unknown long string unchanged", () => {
      expect(translateGanZhiToVietnamese("不存在的字")).toBe("不存在的字");
    });
  });
});

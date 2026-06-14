import { describe, it, expect } from "vitest";
import { generationOf, kinshipTerm } from "../../src/application/people/kinship";
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

/*
 Fixture:
   ông(g, nam) ⚭ bà(gw, nữ, lấy vào)
   ├─ Bố(dad, nam, order 0) ⚭ Mẹ(mom, nữ, lấy vào)
   │   ├─ Anh(bro, nam, order 0)
   │   ├─ Tôi(me, nam, order 1)
   │   └─ Em gái(sis, nữ, order 2)
   │       └─ con: kid(nam) [của me]
   └─ Cô(aunt, nữ, order 1) ⚭ Dượng(unclehb, nam, lấy vào)
       └─ Em họ(cousin, nam)
*/
function fixture(): Person[] {
  return [
    person({ id: "g", gender: "male", spouseId: "gw", order: 0 }),
    person({ id: "gw", gender: "female", isMarriedIn: true, spouseId: "g" }),
    person({ id: "dad", gender: "male", parentId: "g", order: 0, spouseId: "mom" }),
    person({ id: "mom", gender: "female", isMarriedIn: true, spouseId: "dad" }),
    person({ id: "aunt", gender: "female", parentId: "g", order: 1, spouseId: "unclehb" }),
    person({ id: "unclehb", gender: "male", isMarriedIn: true, spouseId: "aunt" }),
    person({ id: "bro", gender: "male", parentId: "dad", order: 0 }),
    person({ id: "me", gender: "male", parentId: "dad", order: 1 }),
    person({ id: "sis", gender: "female", parentId: "dad", order: 2 }),
    person({ id: "kid", gender: "male", parentId: "me", order: 0 }),
    person({ id: "cousin", gender: "male", parentId: "aunt", order: 0 }),
  ];
}

describe("generationOf", () => {
  it("counts generations (blood root = 1)", () => {
    const p = fixture();
    expect(generationOf(p, "g")).toBe(1);
    expect(generationOf(p, "dad")).toBe(2);
    expect(generationOf(p, "me")).toBe(3);
    expect(generationOf(p, "kid")).toBe(4);
  });

  it("uses the spouse's generation for a married-in person", () => {
    const p = fixture();
    expect(generationOf(p, "mom")).toBe(2); // same as dad
    expect(generationOf(p, "gw")).toBe(1); // same as ông
  });
});

describe("kinshipTerm (from = me)", () => {
  const p = fixture();
  const t = (toId: string) => kinshipTerm(p, "me", toId);

  it("direct line up", () => {
    expect(t("dad")).toBe("cha");
    expect(t("mom")).toBe("mẹ"); // mẹ (lấy vào → theo bố)
    expect(t("g")).toBe("ông nội");
    expect(t("gw")).toBe("mệ nội"); // mệ (miền Trung) (lấy vào → theo ông)
  });

  it("direct line down", () => {
    expect(t("kid")).toBe("con");
  });

  it("siblings by order + gender", () => {
    expect(t("bro")).toBe("anh");
    expect(t("sis")).toBe("em");
  });

  it("parent's siblings (O / dượng)", () => {
    expect(t("aunt")).toBe("O"); // chị/em gái của bố → O (miền Trung)
    expect(t("unclehb")).toBe("dượng"); // chồng của O → dượng
  });

  it("first cousins", () => {
    expect(t("cousin")).toBe("em họ");
  });

  it("self and spouse edge cases", () => {
    expect(kinshipTerm(p, "me", "me")).toBe("chính mình");
    expect(kinshipTerm(p, "dad", "mom")).toBe("vợ");
    expect(kinshipTerm(p, "mom", "dad")).toBe("chồng");
  });
});

describe("kinshipTerm (downward)", () => {
  it("ancestor addresses descendant", () => {
    const p = fixture();
    expect(kinshipTerm(p, "g", "me")).toBe("cháu"); // ông gọi cháu
    expect(kinshipTerm(p, "dad", "cousin")).toBe("cháu"); // bác gọi cháu
    expect(kinshipTerm(p, "g", "kid")).toBe("chắt");
  });
});

describe("kinshipTerm (paternal extras)", () => {
  // cụ(gg) → ông(g) → { Bác(uncle, order 0) ⚭ uncw, Bố(dad, order 1),
  //                     Chú(chu, order 2) ⚭ thim }
  // Bố → me; Bác → coz
  const p: Person[] = [
    person({ id: "gg", gender: "male", order: 0 }),
    person({ id: "g", gender: "male", parentId: "gg", order: 0 }),
    person({ id: "uncle", gender: "male", parentId: "g", order: 0, spouseId: "uncw" }),
    person({ id: "uncw", gender: "female", isMarriedIn: true, spouseId: "uncle" }),
    person({ id: "dad", gender: "male", parentId: "g", order: 1 }),
    person({ id: "chu", gender: "male", parentId: "g", order: 2, spouseId: "thim" }),
    person({ id: "thim", gender: "female", isMarriedIn: true, spouseId: "chu" }),
    person({ id: "me", gender: "male", parentId: "dad", order: 0 }),
    person({ id: "coz", gender: "female", parentId: "uncle", order: 0 }),
  ];

  it("addresses a great-grandparent as cụ", () => {
    expect(kinshipTerm(p, "me", "gg")).toBe("cụ ông");
  });
  it("addresses father's older brother as bác", () => {
    expect(kinshipTerm(p, "me", "uncle")).toBe("bác");
  });
  it("addresses bác's wife as bác", () => {
    expect(kinshipTerm(p, "me", "uncw")).toBe("bác");
  });
  it("addresses father's younger brother as chú, his wife as thím", () => {
    expect(kinshipTerm(p, "me", "chu")).toBe("chú");
    expect(kinshipTerm(p, "me", "thim")).toBe("thím");
  });
  it("addresses an older first cousin as chị họ", () => {
    expect(kinshipTerm(p, "me", "coz")).toBe("chị họ");
  });
});

describe("kinshipTerm (maternal — tree built through the mother)", () => {
  // ông ngoại(mg) → { Mẹ(mom, order 0), Cậu(cau, order 1) ⚭ mu,
  //                   Dì(di, order 2) ⚭ dihb }
  // me has the mother as recorded parent.
  const p: Person[] = [
    person({ id: "mg", gender: "male", order: 0 }),
    person({ id: "mom", gender: "female", parentId: "mg", order: 0 }),
    person({ id: "cau", gender: "male", parentId: "mg", order: 1, spouseId: "mu" }),
    person({ id: "mu", gender: "female", isMarriedIn: true, spouseId: "cau" }),
    person({ id: "di", gender: "female", parentId: "mg", order: 2, spouseId: "dihb" }),
    person({ id: "dihb", gender: "male", isMarriedIn: true, spouseId: "di" }),
    person({ id: "me", gender: "male", parentId: "mom", order: 0 }),
  ];

  it("addresses mother's siblings as cậu / dì", () => {
    expect(kinshipTerm(p, "me", "cau")).toBe("cậu");
    expect(kinshipTerm(p, "me", "di")).toBe("dì");
  });
  it("addresses cậu's wife as mự, dì's husband as dượng", () => {
    expect(kinshipTerm(p, "me", "mu")).toBe("mự");
    expect(kinshipTerm(p, "me", "dihb")).toBe("dượng");
  });
  it("addresses maternal grandfather as ông ngoại", () => {
    expect(kinshipTerm(p, "me", "mg")).toBe("ông ngoại");
  });
});

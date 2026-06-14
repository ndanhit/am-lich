import type { Person } from "../../core/models/types";

/** Build [self, parent, grandparent, ... root] via parentId (cycle-safe). */
function ancestorChain(byId: Map<string, Person>, id: string): string[] {
  const chain: string[] = [];
  const seen = new Set<string>();
  let cur: string | null = id;
  while (cur != null && !seen.has(cur)) {
    seen.add(cur);
    chain.push(cur);
    cur = byId.get(cur)?.parentId ?? null;
  }
  return chain;
}

/**
 * Generation number within the tree (a blood root = đời 1). A married-in person
 * takes the generation of their blood spouse.
 */
export function generationOf(people: Person[], id: string): number {
  const byId = new Map(people.map((p) => [p.id, p]));
  const p = byId.get(id);
  if (!p) return 0;
  const anchorId =
    p.isMarriedIn && p.spouseId && byId.has(p.spouseId) ? p.spouseId : id;
  return ancestorChain(byId, anchorId).length;
}

const DOWN = ["", "con", "cháu", "chắt", "chít", "chút"];
function termDown(level: number): string {
  return DOWN[level] ?? `hậu duệ đời thứ ${level}`;
}

function termUp(level: number, parentGender: string, toGender: string): string {
  if (level === 1) return toGender === "female" ? "mẹ" : "cha";
  if (level === 2) {
    const side = parentGender === "female" ? "ngoại" : "nội";
    // Phương ngữ miền Trung: "mệ" thay cho "bà".
    return `${toGender === "female" ? "mệ" : "ông"} ${side}`;
  }
  if (level === 3) return toGender === "female" ? "cụ bà" : "cụ ông";
  if (level === 4) return "kỵ";
  return `tổ tiên đời thứ ${level}`;
}

function elder(toGender: string): string {
  return toGender === "female" ? "chị" : "anh";
}

/** Structural kinship between two BLOOD people, gendered for display by `toGender`. */
function structuralTerm(
  byId: Map<string, Person>,
  fromBloodId: string,
  toBloodId: string,
  toOrder: number,
  toGender: string,
  toIsMarriedIn: boolean,
): string {
  const a = ancestorChain(byId, fromBloodId);
  const b = ancestorChain(byId, toBloodId);
  const bIndex = new Map(b.map((id, i) => [id, i]));

  let dA = -1;
  let dB = -1;
  for (let i = 0; i < a.length; i++) {
    if (bIndex.has(a[i])) {
      dA = i;
      dB = bIndex.get(a[i])!;
      break;
    }
  }
  if (dA < 0) return "họ hàng xa";

  if (dA === 0) return termDown(dB); // from is ancestor of to
  if (dB === 0) {
    const parentGender = byId.get(a[1])?.gender ?? "male";
    return termUp(dA, parentGender, toGender);
  }

  const from = byId.get(fromBloodId)!;

  // Siblings.
  if (dA === 1 && dB === 1) {
    return toOrder < from.order ? elder(toGender) : "em";
  }

  // Cousins (same generation, common ancestor ≥ grandparent).
  if (dA === dB) {
    const childA = byId.get(a[dA - 1])!;
    const childB = byId.get(b[dB - 1])!;
    return childB.order < childA.order ? `${elder(toGender)} họ` : "em họ";
  }

  // `to` is a sibling of `from`'s parent (uncle/aunt level) — or that
  // sibling's married-in spouse. Phương ngữ miền Trung:
  //  - Bên nội: anh trai của ba = bác (vợ cũng bác); em trai của ba = chú
  //    (vợ = thím); chị/em gái của ba = O (chồng = dượng).
  //  - Bên ngoại: anh/em trai của mẹ = cậu (vợ = mự); chị/em gái của mẹ = dì
  //    (chồng = dượng).
  if (dA === 2 && dB === 1) {
    const parent = byId.get(a[1])!;
    const paternal = parent.gender !== "female";
    const sibling = byId.get(toBloodId)!;
    const siblingFemale = sibling.gender === "female";
    const senior = toOrder < parent.order;
    if (paternal) {
      if (siblingFemale) return toIsMarriedIn ? "dượng" : "O";
      if (senior) return "bác"; // anh trai của ba — vợ cũng gọi bác
      return toIsMarriedIn ? "thím" : "chú";
    }
    if (siblingFemale) return toIsMarriedIn ? "dượng" : "dì";
    return toIsMarriedIn ? "mự" : "cậu";
  }

  if (dA === 1) return "cháu"; // from is parent-level of to

  const gap = dA - dB;
  return gap > 0 ? `vai dưới ${gap} đời` : `vai trên ${-gap} đời`;
}

/**
 * How `from` addresses `to` (Vietnamese kinship). Best-effort: covers direct
 * line, siblings, cousins, parent's siblings (bác/chú/cô/cậu/dì), spouse, and
 * married-in people via their blood partner. Far/odd relations fall back to a
 * generic description.
 */
export function kinshipTerm(
  people: Person[],
  fromId: string,
  toId: string,
): string {
  if (fromId === toId) return "chính mình";
  const byId = new Map(people.map((p) => [p.id, p]));
  const from = byId.get(fromId);
  const to = byId.get(toId);
  if (!from || !to) return "";

  if (from.spouseId === toId) {
    return from.gender === "male"
      ? "vợ"
      : from.gender === "female"
        ? "chồng"
        : "bạn đời";
  }

  // Anchor each side to a blood-line person (married-in → their spouse).
  const fromBlood =
    from.isMarriedIn && from.spouseId && byId.has(from.spouseId)
      ? from.spouseId
      : fromId;
  const toBlood =
    to.isMarriedIn && to.spouseId && byId.has(to.spouseId)
      ? to.spouseId
      : toId;

  if (fromBlood === toBlood) return "họ hàng (bên dâu/rể)";

  // Seniority from the blood anchor's order; gender from the actual `to`
  // (so e.g. an uncle's wife still shows a female-appropriate term).
  const toOrder = byId.get(toBlood)!.order;
  const toIsMarriedIn = toBlood !== toId;
  return structuralTerm(byId, fromBlood, toBlood, toOrder, to.gender, toIsMarriedIn);
}

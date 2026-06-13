import type { Person } from "../../core/models/types";

/** Per-generation breakdown of descendants (depth 1 = con, 2 = cháu, ...). */
export type GenerationStat = {
  depth: number;
  count: number;
  male: number;
  female: number;
  other: number;
};

/** Aggregated statistics about the branch rooted at a given person. */
export type BranchInsights = {
  generations: number; // số thế hệ huyết thống (>=1, tính cả gốc)
  descendants: number; // tổng con cháu huyết thống (không tính gốc)
  directChildren: number;
  maleDescendants: number;
  femaleDescendants: number;
  otherDescendants: number;
  generationStats: GenerationStat[]; // theo đời con/cháu/chắt/chít (depth tăng dần)
  daughtersInLaw: number; // dâu = vợ "lấy vào" của hậu duệ (married-in nữ)
  sonsInLaw: number; // rể = chồng "lấy vào" của hậu duệ (married-in nam)
  totalMembers: number; // huyết thống + dâu/rể, gồm cả gốc + vợ/chồng gốc
};

const EMPTY: BranchInsights = {
  generations: 1,
  descendants: 0,
  directChildren: 0,
  maleDescendants: 0,
  femaleDescendants: 0,
  otherDescendants: 0,
  generationStats: [],
  daughtersInLaw: 0,
  sonsInLaw: 0,
  totalMembers: 0,
};

/**
 * Compute statistics for the family branch rooted at `rootId`: blood
 * descendants (via parentId) plus their married-in spouses (dâu/rể).
 */
export function computeBranchInsights(
  people: Person[],
  rootId: string,
): BranchInsights {
  const byId = new Map(people.map((p) => [p.id, p]));
  let root = byId.get(rootId);
  if (!root) return { ...EMPTY };

  // Per-couple view: a married-in person reports the branch of their blood
  // partner (the main-branch node).
  if (root.isMarriedIn && root.spouseId != null) {
    const partner = byId.get(root.spouseId);
    if (partner) {
      root = partner;
      rootId = partner.id;
    }
  }

  const childrenByParent = new Map<string, string[]>();
  for (const p of people) {
    if (p.parentId != null) {
      const list = childrenByParent.get(p.parentId) ?? [];
      list.push(p.id);
      childrenByParent.set(p.parentId, list);
    }
  }

  let male = 0;
  let female = 0;
  let other = 0;
  let daughtersInLaw = 0;
  let sonsInLaw = 0;
  const genMap = new Map<number, GenerationStat>();

  // Branch members: root + blood descendants + their married-in spouses.
  const members = new Set<string>([rootId]);

  const addSpouse = (person: Person, countInLaw: boolean): void => {
    if (person.spouseId == null) return;
    const spouse = byId.get(person.spouseId);
    if (!spouse || !spouse.isMarriedIn) return;
    members.add(spouse.id);
    if (countInLaw) {
      if (spouse.gender === "female") daughtersInLaw += 1;
      else if (spouse.gender === "male") sonsInLaw += 1;
    }
  };

  // Root's own spouse joins the branch but is not counted as dâu/rể.
  addSpouse(root, false);

  // BFS over blood descendants, tracking depth (1 = con, 2 = cháu, ...).
  const visited = new Set<string>([rootId]);
  const queue: Array<{ id: string; depth: number }> = [{ id: rootId, depth: 0 }];
  let maxDepth = 0;
  while (queue.length > 0) {
    const { id, depth } = queue.shift()!;
    for (const childId of childrenByParent.get(id) ?? []) {
      if (visited.has(childId)) continue;
      visited.add(childId);
      const child = byId.get(childId);
      if (!child) continue;
      const d = depth + 1;
      maxDepth = Math.max(maxDepth, d);
      members.add(childId);

      const stat =
        genMap.get(d) ?? { depth: d, count: 0, male: 0, female: 0, other: 0 };
      stat.count += 1;
      if (child.gender === "male") {
        male += 1;
        stat.male += 1;
      } else if (child.gender === "female") {
        female += 1;
        stat.female += 1;
      } else {
        other += 1;
        stat.other += 1;
      }
      genMap.set(d, stat);

      addSpouse(child, true);
      queue.push({ id: childId, depth: d });
    }
  }

  const generationStats = [...genMap.values()].sort((a, b) => a.depth - b.depth);

  return {
    generations: maxDepth + 1,
    descendants: male + female + other,
    directChildren: genMap.get(1)?.count ?? 0,
    maleDescendants: male,
    femaleDescendants: female,
    otherDescendants: other,
    generationStats,
    daughtersInLaw,
    sonsInLaw,
    totalMembers: members.size,
  };
}

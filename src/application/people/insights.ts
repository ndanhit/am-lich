import type { Person } from "../../core/models/types";
import { getDescendantIds } from "./tree";

/** Aggregated statistics about the branch rooted at a given person. */
export type BranchInsights = {
  generations: number; // số thế hệ huyết thống (>=1, tính cả gốc)
  descendants: number; // tổng con cháu huyết thống (không tính gốc)
  directChildren: number;
  maleDescendants: number;
  femaleDescendants: number;
  otherDescendants: number;
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
  const root = byId.get(rootId);
  if (!root) return { ...EMPTY };

  const descendantIds = getDescendantIds(people, rootId);

  let male = 0;
  let female = 0;
  let other = 0;
  let daughtersInLaw = 0;
  let sonsInLaw = 0;

  // Branch members: root + blood descendants + their married-in spouses.
  const members = new Set<string>([rootId, ...descendantIds]);

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

  for (const id of descendantIds) {
    const person = byId.get(id);
    if (!person) continue;
    if (person.gender === "male") male += 1;
    else if (person.gender === "female") female += 1;
    else other += 1;
    addSpouse(person, true);
  }

  const directChildren = people.filter((p) => p.parentId === rootId).length;

  return {
    generations: maxBloodDepth(people, rootId) + 1,
    descendants: descendantIds.size,
    directChildren,
    maleDescendants: male,
    femaleDescendants: female,
    otherDescendants: other,
    daughtersInLaw,
    sonsInLaw,
    totalMembers: members.size,
  };
}

/** Deepest blood generation below `rootId` (root = 0). Cycle-safe. */
function maxBloodDepth(people: Person[], rootId: string): number {
  const childrenByParent = new Map<string, string[]>();
  for (const p of people) {
    if (p.parentId != null) {
      const list = childrenByParent.get(p.parentId) ?? [];
      list.push(p.id);
      childrenByParent.set(p.parentId, list);
    }
  }

  const visited = new Set<string>();
  const dfs = (id: string): number => {
    if (visited.has(id)) return 0;
    visited.add(id);
    let max = 0;
    for (const child of childrenByParent.get(id) ?? []) {
      max = Math.max(max, 1 + dfs(child));
    }
    return max;
  };
  return dfs(rootId);
}

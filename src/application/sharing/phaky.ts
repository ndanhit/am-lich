import type { Person } from "../../core/models/types";

export type PhaKyEntry = {
  generation: number;
  person: Person;
  parentName: string | null;
  spouseName: string | null;
};

/** Generation of a person within the tree (blood root = 1). Cycle-safe. */
function generationIn(byId: Map<string, Person>, id: string): number {
  let depth = 1;
  const seen = new Set<string>();
  let cur: string | null = id;
  while (cur != null && !seen.has(cur)) {
    seen.add(cur);
    const p = byId.get(cur);
    const parent = p?.parentId ?? null;
    if (parent == null) break;
    depth += 1;
    cur = parent;
  }
  return depth;
}

/**
 * Build a "phả ký" — blood-line members ordered by generation then sibling
 * order, each with resolved parent & spouse names. (Married-in spouses are
 * surfaced via their partner's `spouseName`, not as standalone entries.)
 */
export function buildPhaKy(people: Person[]): PhaKyEntry[] {
  const byId = new Map(people.map((p) => [p.id, p]));
  const blood = people.filter((p) => !p.isMarriedIn);

  const entries: PhaKyEntry[] = blood.map((person) => {
    const parent = person.parentId ? byId.get(person.parentId) : undefined;
    const spouse = person.spouseId ? byId.get(person.spouseId) : undefined;
    return {
      generation: generationIn(byId, person.id),
      person,
      parentName: parent ? parent.name : null,
      spouseName: spouse ? spouse.name : null,
    };
  });

  entries.sort(
    (a, b) =>
      a.generation - b.generation ||
      a.person.order - b.person.order ||
      a.person.name.localeCompare(b.person.name, "vi"),
  );
  return entries;
}

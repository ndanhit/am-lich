import type { FamilyTree, Person } from "../../core/models/types";
import { convertSolarToLunar } from "../../core/lunar-math/converter";

/** Legacy people with a complete solar death date but no lunar giỗ yet. */
function needsGioBackfill(p: Person): boolean {
  return (
    p.deathLunar == null &&
    p.deathDate != null &&
    p.deathDate.month != null &&
    p.deathDate.day != null
  );
}

export function addFamily(
  families: FamilyTree[],
  newFamily: FamilyTree,
): FamilyTree[] {
  if (families.some((f) => f.id === newFamily.id)) {
    throw new Error(`Family with ID ${newFamily.id} already exists.`);
  }
  return [...families, newFamily];
}

export function updateFamily(
  families: FamilyTree[],
  updated: FamilyTree,
): FamilyTree[] {
  if (!families.some((f) => f.id === updated.id)) {
    throw new Error(`Family with ID ${updated.id} not found.`);
  }
  return families.map((f) => (f.id === updated.id ? { ...updated } : f));
}

export function removeFamily(
  families: FamilyTree[],
  idToRemove: string,
): FamilyTree[] {
  return families.filter((f) => f.id !== idToRemove);
}

/** Remove every person belonging to a deleted tree (cascade). */
export function removeTreePeople(people: Person[], treeId: string): Person[] {
  return people.filter((p) => p.treeId !== treeId);
}

export function importFamilies(
  local: FamilyTree[],
  imported: FamilyTree[],
): FamilyTree[] {
  const localMap = new Map(local.map((f) => [f.id, f]));
  for (const imp of imported) {
    const loc = localMap.get(imp.id);
    if (!loc || imp.updatedAt > loc.updatedAt) {
      localMap.set(imp.id, imp);
    }
  }
  return Array.from(localMap.values());
}

export function validateFamilyParams(name: string): void {
  if (!name || !name.trim()) {
    throw new Error("Tên gia phả không được để trống");
  }
}

/**
 * Backward-compat: assign every person without a `treeId` to a tree.
 * If no tree exists yet, create a default one via `makeDefaultTree`.
 * Returns new arrays plus a `changed` flag (false = nothing to migrate).
 */
export function migratePeople(
  people: Person[],
  families: FamilyTree[],
  makeDefaultTree: () => FamilyTree,
): { people: Person[]; families: FamilyTree[]; changed: boolean } {
  const hasOrphans = people.some((p) => !p.treeId);
  const hasGioBackfill = people.some(needsGioBackfill);
  if (!hasOrphans && !hasGioBackfill) {
    return { people, families, changed: false };
  }

  let nextFamilies = families;
  let target = families[0];
  if (hasOrphans && !target) {
    target = makeDefaultTree();
    nextFamilies = [target];
  }
  const nextPeople = people.map((p) => {
    let np = p;
    if (!np.treeId && target) np = { ...np, treeId: target.id };
    if (needsGioBackfill(np)) {
      const d = np.deathDate!;
      const lunar = convertSolarToLunar(d.year, d.month!, d.day!);
      if (lunar) {
        np = {
          ...np,
          deathLunar: { day: lunar.lunarDay, month: Math.abs(lunar.lunarMonth) },
        };
      }
    }
    return np;
  });
  return { people: nextPeople, families: nextFamilies, changed: true };
}

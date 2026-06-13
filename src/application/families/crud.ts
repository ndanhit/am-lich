import type { FamilyTree, Person } from "../../core/models/types";

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
  if (!hasOrphans) return { people, families, changed: false };

  let target = families[0];
  let nextFamilies = families;
  if (!target) {
    target = makeDefaultTree();
    nextFamilies = [target];
  }
  const nextPeople = people.map((p) =>
    p.treeId ? p : { ...p, treeId: target.id },
  );
  return { people: nextPeople, families: nextFamilies, changed: true };
}

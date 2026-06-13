import type { FamilyTree, Person } from "../../core/models/types";

/** A self-contained, shareable snapshot of one family tree. */
export type SharedSnapshot = {
  version: number;
  family: FamilyTree;
  people: Person[];
};

export type SnapshotOptions = {
  /** Strip sensitive free-text (notes, burial place) for public sharing. */
  hideSensitive?: boolean;
};

/**
 * Build a shareable snapshot containing a family and only the people that
 * belong to it. With `hideSensitive`, private free-text fields are removed.
 */
export function buildFamilySnapshot(
  family: FamilyTree,
  people: Person[],
  options: SnapshotOptions = {},
): SharedSnapshot {
  const members = people
    .filter((p) => p.treeId === family.id)
    .map((p) =>
      options.hideSensitive ? { ...p, notes: "", burialPlace: "" } : p,
    );
  return { version: 1, family, people: members };
}

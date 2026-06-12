import type { Person } from "../../core/models/types";
import { addPerson, updatePerson } from "./crud";
import { getDescendantIds } from "./tree";

/**
 * Attach a new blood child under an existing blood parent.
 * `newChild` must already have id/timestamps; parentId/isMarriedIn are enforced here.
 */
export function attachChild(
  people: Person[],
  parentId: string,
  newChild: Person,
): Person[] {
  const parent = people.find((p) => p.id === parentId);
  if (!parent) throw new Error("Không tìm thấy người để thêm con");
  if (parent.isMarriedIn) {
    throw new Error("Chỉ thêm con cho người thuộc nhánh chính");
  }
  const child: Person = {
    ...newChild,
    parentId,
    isMarriedIn: false,
  };
  return addPerson(people, child);
}

/**
 * Attach a married-in spouse to a blood person (mutual spouseId link).
 * Single-spouse rule: throws if the person already has a spouse.
 */
export function attachSpouse(
  people: Person[],
  personId: string,
  newSpouse: Person,
): Person[] {
  const person = people.find((p) => p.id === personId);
  if (!person) throw new Error("Không tìm thấy người để thêm vợ/chồng");
  if (person.isMarriedIn) {
    throw new Error("Không thể thêm vợ/chồng cho người đã là dâu/rể");
  }
  if (person.gender === "other") {
    throw new Error("Người này không thể thêm vợ/chồng");
  }
  if (person.spouseId != null) {
    throw new Error("Người này đã có vợ/chồng");
  }
  const spouse: Person = {
    ...newSpouse,
    isMarriedIn: true,
    parentId: null,
    spouseId: personId,
  };
  const withSpouse = addPerson(people, spouse);
  return updatePerson(withSpouse, {
    ...person,
    spouseId: spouse.id,
    updatedAt: Date.now(),
  });
}

/**
 * Attach a new blood parent above an existing blood person (which becomes a child).
 * Throws if the child already has a parent (single parent slot).
 */
export function attachParent(
  people: Person[],
  childId: string,
  newParent: Person,
): Person[] {
  const child = people.find((p) => p.id === childId);
  if (!child) throw new Error("Không tìm thấy người để thêm cha/mẹ");
  if (child.isMarriedIn) {
    throw new Error("Không thể thêm cha/mẹ cho người lấy vào");
  }
  if (child.parentId != null) {
    throw new Error("Người này đã có cha/mẹ trong cây");
  }
  const parent: Person = {
    ...newParent,
    isMarriedIn: false,
    parentId: null,
  };
  const withParent = addPerson(people, parent);
  return updatePerson(withParent, {
    ...child,
    parentId: parent.id,
    updatedAt: Date.now(),
  });
}

/**
 * Remove a person with cascade rules:
 * - married-in person: remove it and unlink the partner's spouseId.
 * - blood person: remove the whole blood subtree (the person + all blood
 *   descendants) along with every married-in spouse attached to those people.
 */
export function removePersonCascade(people: Person[], id: string): Person[] {
  const target = people.find((p) => p.id === id);
  if (!target) return people;

  if (target.isMarriedIn) {
    return people
      .filter((p) => p.id !== id)
      .map((p) =>
        p.spouseId === id ? { ...p, spouseId: null, updatedAt: Date.now() } : p,
      );
  }

  // Blood person → collect subtree (self + blood descendants).
  const toRemove = new Set<string>([id, ...getDescendantIds(people, id)]);
  // Plus the married-in spouse of every blood person being removed.
  for (const p of people) {
    if (toRemove.has(p.id) && p.spouseId != null) {
      const spouse = people.find((s) => s.id === p.spouseId);
      if (spouse && spouse.isMarriedIn) toRemove.add(spouse.id);
    }
  }
  return people
    .filter((p) => !toRemove.has(p.id))
    .map((p) =>
      p.spouseId != null && toRemove.has(p.spouseId)
        ? { ...p, spouseId: null, updatedAt: Date.now() }
        : p,
    );
}

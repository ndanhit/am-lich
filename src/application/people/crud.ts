import type { Person, PartialDate, Gender } from "../../core/models/types";

export function addPerson(people: Person[], newPerson: Person): Person[] {
  if (people.some((p) => p.id === newPerson.id)) {
    throw new Error(`Person with ID ${newPerson.id} already exists.`);
  }
  return [...people, newPerson];
}

export function updatePerson(people: Person[], updated: Person): Person[] {
  if (!people.some((p) => p.id === updated.id)) {
    throw new Error(`Person with ID ${updated.id} not found.`);
  }
  return people.map((p) => (p.id === updated.id ? { ...updated } : p));
}

/**
 * Remove a person and clean up dangling references: any remaining person
 * pointing at the removed id via parentId/spouseId gets that ref reset to
 * null (and its updatedAt bumped) so the tree never holds orphan pointers.
 */
export function removePerson(people: Person[], idToRemove: string): Person[] {
  const now = Date.now();
  return people
    .filter((p) => p.id !== idToRemove)
    .map((p) => {
      const danglingParent = p.parentId === idToRemove;
      const danglingSpouse = p.spouseId === idToRemove;
      if (!danglingParent && !danglingSpouse) return p;
      return {
        ...p,
        parentId: danglingParent ? null : p.parentId,
        spouseId: danglingSpouse ? null : p.spouseId,
        updatedAt: now,
      };
    });
}

export function importPeople(
  localPeople: Person[],
  importedPeople: Person[],
): Person[] {
  const localMap = new Map(localPeople.map((p) => [p.id, p]));
  for (const imported of importedPeople) {
    const local = localMap.get(imported.id);
    if (!local || imported.updatedAt > local.updatedAt) {
      localMap.set(imported.id, imported);
    }
  }
  return Array.from(localMap.values());
}

/**
 * Validate a partially-known birth/death date. Year is required; month/day are
 * optional but a day requires a month, and a present day/month must be valid.
 */
function validatePartialDate(date: PartialDate, label: string): void {
  if (!Number.isInteger(date.year) || date.year < 1901 || date.year > 2099) {
    throw new Error(`Năm ${label} không hợp lệ`);
  }
  if (date.month != null) {
    if (!Number.isInteger(date.month) || date.month < 1 || date.month > 12) {
      throw new Error(`Tháng ${label} không hợp lệ`);
    }
  }
  if (date.day != null) {
    if (date.month == null) {
      throw new Error(`Tháng ${label} không hợp lệ`);
    }
    if (!Number.isInteger(date.day) || date.day < 1 || date.day > 31) {
      throw new Error(`Ngày ${label} không hợp lệ`);
    }
    const probe = new Date(date.year, date.month - 1, date.day);
    if (
      probe.getFullYear() !== date.year ||
      probe.getMonth() !== date.month - 1 ||
      probe.getDate() !== date.day
    ) {
      throw new Error(`Ngày ${label} không tồn tại`);
    }
  }
}

/**
 * Compare two partial dates ascending, skipping unknown components: returns 0
 * at the first level that cannot be determined. Used only to reject a death
 * date that is *certainly* before a birth date.
 */
function comparePartialAsc(a: PartialDate, b: PartialDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month == null || b.month == null) return 0;
  if (a.month !== b.month) return a.month - b.month;
  if (a.day == null || b.day == null) return 0;
  return a.day - b.day;
}

/**
 * Validate the shape of person creation parameters. Throws on invalid input.
 * birthDate/deathDate may both be null (không rõ). Khi có cả hai, ngày mất
 * không được sớm hơn ngày sinh.
 */
export function validatePersonCreationParams(
  name: string,
  birthDate: PartialDate | null,
  deathDate: PartialDate | null,
): void {
  if (!name || !name.trim()) {
    throw new Error("Tên thành viên không được để trống");
  }
  if (birthDate) {
    validatePartialDate(birthDate, "sinh");
  }
  if (deathDate) {
    validatePartialDate(deathDate, "mất");
  }
  if (birthDate && deathDate && comparePartialAsc(deathDate, birthDate) < 0) {
    throw new Error("Ngày mất không thể trước ngày sinh");
  }
}

/** Whitelist of valid gender values for import validation. */
export const VALID_GENDERS: ReadonlyArray<Gender> = ["male", "female", "other"];

export function isValidGender(value: unknown): value is Gender {
  return (
    typeof value === "string" && VALID_GENDERS.includes(value as Gender)
  );
}

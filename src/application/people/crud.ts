import type { Person, SolarDate, Gender } from "../../core/models/types";

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
 * Validate a single solar date used for birth/death.
 * Mirrors the bounds + existence check from validateMemoCreationParams.
 */
function validateSolarDate(date: SolarDate, label: string): void {
  if (!Number.isInteger(date.year) || date.year < 1901 || date.year > 2099) {
    throw new Error(`Năm ${label} không hợp lệ`);
  }
  if (!Number.isInteger(date.month) || date.month < 1 || date.month > 12) {
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

function compareSolarAsc(a: SolarDate, b: SolarDate): number {
  if (a.year !== b.year) return a.year - b.year;
  if (a.month !== b.month) return a.month - b.month;
  return a.day - b.day;
}

/**
 * Validate the shape of person creation parameters. Throws on invalid input.
 * birthDate/deathDate may both be null (không rõ). Khi có cả hai, ngày mất
 * không được sớm hơn ngày sinh.
 */
export function validatePersonCreationParams(
  name: string,
  birthDate: SolarDate | null,
  deathDate: SolarDate | null,
): void {
  if (!name || !name.trim()) {
    throw new Error("Tên thành viên không được để trống");
  }
  if (birthDate) {
    validateSolarDate(birthDate, "sinh");
  }
  if (deathDate) {
    validateSolarDate(deathDate, "mất");
  }
  if (birthDate && deathDate && compareSolarAsc(deathDate, birthDate) < 0) {
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

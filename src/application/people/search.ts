import type { Person } from "../../core/models/types";

export type PersonStatusFilter = "all" | "alive" | "deceased";

export type SearchFilters = {
  query: string;
  status: PersonStatusFilter;
};

/** Lowercase + strip Vietnamese diacritics for accent-insensitive matching. */
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

function isDeceasedPerson(p: Person): boolean {
  return p.isDeceased || p.deathDate !== null;
}

/**
 * Filter people by name (accent-insensitive substring) and living status.
 * Searches `name`, `aliasName` and `altNames`. Results sorted by name.
 */
export function searchPeople(
  people: Person[],
  filters: SearchFilters,
): Person[] {
  const q = normalizeText(filters.query.trim());

  const matched = people.filter((p) => {
    if (filters.status === "alive" && isDeceasedPerson(p)) return false;
    if (filters.status === "deceased" && !isDeceasedPerson(p)) return false;
    if (q === "") return true;
    const haystack = normalizeText(
      `${p.name} ${p.aliasName ?? ""} ${p.altNames ?? ""}`,
    );
    return haystack.includes(q);
  });

  return matched.sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

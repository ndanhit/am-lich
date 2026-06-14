import type { Person } from "../../core/models/types";
import { generationOf } from "./kinship";

/** Generation filter: a specific đời (1, 2, …) or "all". */
export type GenerationFilter = number | "all";

export type SearchFilters = {
  query: string;
  generation: GenerationFilter;
};

/** Lowercase + strip Vietnamese diacritics for accent-insensitive matching. */
export function normalizeText(str: string): string {
  return str
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/đ/g, "d");
}

/**
 * Filter people by name (accent-insensitive substring) and by generation (đời).
 * Searches `name`, `aliasName` and `altNames`. Results sorted by name.
 */
export function searchPeople(
  people: Person[],
  filters: SearchFilters,
): Person[] {
  const q = normalizeText(filters.query.trim());

  const matched = people.filter((p) => {
    if (
      filters.generation !== "all" &&
      generationOf(people, p.id) !== filters.generation
    ) {
      return false;
    }
    if (q === "") return true;
    const haystack = normalizeText(
      `${p.name} ${p.aliasName ?? ""} ${p.altNames ?? ""}`,
    );
    return haystack.includes(q);
  });

  return matched.sort((a, b) => a.name.localeCompare(b.name, "vi"));
}

/** Distinct generations present among `people`, ascending (for filter UIs). */
export function availableGenerations(people: Person[]): number[] {
  const gens = new Set<number>();
  for (const p of people) {
    const g = generationOf(people, p.id);
    if (g > 0) gens.add(g);
  }
  return Array.from(gens).sort((a, b) => a - b);
}

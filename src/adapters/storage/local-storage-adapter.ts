import type { LunarEvent, QuickMemo, Person, FamilyTree } from "../../lib/index";

/**
 * Storage adapter interface — abstracts persistence.
 * Core Engine operates on pure arrays; the adapter bridges to localStorage.
 */
export interface StorageAdapter {
  /** Loads all stored events. Returns [] if no data or on read failure. */
  load(): LunarEvent[];
  /** Replaces all events in storage. Throws on write failure. */
  save(events: LunarEvent[]): void;
  /** Loads all stored quick memos. Returns [] if no data or on read failure. */
  loadMemos(): QuickMemo[];
  /** Replaces all memos in storage. Throws on write failure. */
  saveMemos(memos: QuickMemo[]): void;
  /** Loads the list of system event IDs that the user has hidden. */
  loadHiddenSystemEventIds(): string[];
  /** Persists the list of hidden system event IDs. Throws on write failure. */
  saveHiddenSystemEventIds(ids: string[]): void;
  /** Loads all stored family-tree people. Returns [] if none or on failure. */
  loadPeople(): Person[];
  /** Replaces all people in storage. Throws on write failure. */
  savePeople(people: Person[]): void;
  /** Loads all stored family trees (gia phả). Returns [] if none or on failure. */
  loadFamilyTrees(): FamilyTree[];
  /** Replaces all family trees in storage. Throws on write failure. */
  saveFamilyTrees(families: FamilyTree[]): void;
}

const STORAGE_KEY = "am-lich-events";
const MEMOS_STORAGE_KEY = "am-lich-memos";
const HIDDEN_SYSTEM_EVENTS_KEY = "am-lich-hidden-system-events";
const PEOPLE_STORAGE_KEY = "am-lich-people";
const FAMILIES_STORAGE_KEY = "am-lich-family-trees";

/**
 * LocalStorage implementation of StorageAdapter.
 * Graceful degradation: returns [] on corrupted JSON.
 */
export class LocalStorageAdapter implements StorageAdapter {
  load(): LunarEvent[] {
    return readArray<LunarEvent>(STORAGE_KEY);
  }

  save(events: LunarEvent[]): void {
    writeArray(STORAGE_KEY, events);
  }

  loadMemos(): QuickMemo[] {
    return readArray<QuickMemo>(MEMOS_STORAGE_KEY);
  }

  saveMemos(memos: QuickMemo[]): void {
    writeArray(MEMOS_STORAGE_KEY, memos);
  }

  loadHiddenSystemEventIds(): string[] {
    return readArray<string>(HIDDEN_SYSTEM_EVENTS_KEY).filter(
      (id) => typeof id === "string",
    );
  }

  saveHiddenSystemEventIds(ids: string[]): void {
    writeArray(HIDDEN_SYSTEM_EVENTS_KEY, ids);
  }

  loadPeople(): Person[] {
    return readArray<Person>(PEOPLE_STORAGE_KEY);
  }

  savePeople(people: Person[]): void {
    writeArray(PEOPLE_STORAGE_KEY, people);
  }

  loadFamilyTrees(): FamilyTree[] {
    return readArray<FamilyTree>(FAMILIES_STORAGE_KEY);
  }

  saveFamilyTrees(families: FamilyTree[]): void {
    writeArray(FAMILIES_STORAGE_KEY, families);
  }
}

function readArray<T>(key: string): T[] {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return [];
    const parsed = JSON.parse(raw);
    if (!Array.isArray(parsed)) return [];
    return parsed;
  } catch {
    console.warn(
      `LocalStorageAdapter: Could not parse data for ${key}, returning empty.`,
    );
    return [];
  }
}

function writeArray<T>(key: string, items: T[]): void {
  try {
    localStorage.setItem(key, JSON.stringify(items));
  } catch (err) {
    throw new Error("Failed to save — storage may be full.");
  }
}

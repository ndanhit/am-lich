import type { LunarEvent } from "../../lib/index";

/**
 * Storage adapter interface — abstracts persistence.
 * Core Engine operates on pure arrays; the adapter bridges to localStorage.
 */
export interface StorageAdapter {
  /** Loads all stored events. Returns [] if no data or on read failure. */
  load(): LunarEvent[];
  /** Replaces all events in storage. Throws on write failure. */
  save(events: LunarEvent[]): void;
}

const STORAGE_KEY = "am-lich-events";

/**
 * LocalStorage implementation of StorageAdapter.
 * Graceful degradation: returns [] on corrupted JSON.
 */
export class LocalStorageAdapter implements StorageAdapter {
  load(): LunarEvent[] {
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];
      return parsed;
    } catch {
      // Corrupted JSON — graceful degradation
      console.warn(
        "LocalStorageAdapter: Could not parse stored data, returning empty.",
      );
      return [];
    }
  }

  save(events: LunarEvent[]): void {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
    } catch (err) {
      throw new Error("Failed to save — storage may be full.");
    }
  }
}

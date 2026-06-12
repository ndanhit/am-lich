import { LeapMonthRule, RecurrenceRule } from "../core/models/types";
import type {
  LunarEvent,
  SolarDate,
  PartialDate,
  UpcomingEventOccurrence,
  LunarDateContext,
  QuickMemo,
  GroupedMemos,
  Person,
  FamilyTreeNode,
} from "../core/models/types";
import {
  calculateOccurrencesForYear,
  getUpcomingEvents,
  addEvent,
  updateEvent,
  removeEvent,
  importEvents,
  generateExportPayload,
  validateImportPayload,
  validateEventCreationParams,
  addMemo,
  updateMemo,
  removeMemo,
  importMemos,
  validateMemoCreationParams,
  groupMemosByTitle,
  addPerson,
  updatePerson,
  importPeople,
  validatePersonCreationParams,
  buildFamilyTree,
  attachChild,
  attachSpouse,
  attachParent,
  removePersonCascade,
  VIETNAMESE_HOLIDAYS,
  isSystemEventId,
} from "../lib/index";
import type { StorageAdapter } from "../adapters/storage/local-storage-adapter";
import type { EventFormData, MemoFormData, PersonFormData } from "./types";

export type StateListener = () => void;

/**
 * Application state manager.
 * Loads events from StorageAdapter on init and provides
 * reactive re-render hooks for UI components.
 */
export class AppState {
  private events: LunarEvent[] = [];
  private memos: QuickMemo[] = [];
  private people: Person[] = [];
  private hiddenSystemEventIds: Set<string> = new Set();
  private listeners: StateListener[] = [];
  private adapter: StorageAdapter;
  private _corruptedOnLoad = false;

  constructor(adapter: StorageAdapter) {
    this.adapter = adapter;
    this.events = adapter.load();
    this.memos = adapter.loadMemos();
    this.people = adapter.loadPeople();
    this.hiddenSystemEventIds = new Set(adapter.loadHiddenSystemEventIds());
    // Detect if data was empty due to corruption
    const raw = localStorage.getItem("am-lich-events");
    if (raw && this.events.length === 0) {
      try {
        JSON.parse(raw);
      } catch {
        this._corruptedOnLoad = true;
      }
    }
  }

  get corruptedOnLoad(): boolean {
    return this._corruptedOnLoad;
  }

  clearCorruptedFlag(): void {
    this._corruptedOnLoad = false;
  }

  getEvents(): LunarEvent[] {
    return this.events;
  }

  subscribe(listener: StateListener): () => void {
    this.listeners.push(listener);
    return () => {
      this.listeners = this.listeners.filter((l) => l !== listener);
    };
  }

  private notify(): void {
    this.listeners.forEach((l) => l());
  }

  private persist(): void {
    try {
      this.adapter.save(this.events);
    } catch (err: any) {
      // F3: Surface storage failure to caller for toast handling
      if (err?.name === "QuotaExceededError" || err?.code === 22) {
        throw new Error("Failed to save — storage may be full");
      }
      throw err;
    }
  }

  private persistMemos(): void {
    try {
      this.adapter.saveMemos(this.memos);
    } catch (err: any) {
      if (err?.name === "QuotaExceededError" || err?.code === 22) {
        throw new Error("Failed to save — storage may be full");
      }
      throw err;
    }
  }

  private persistPeople(): void {
    try {
      this.adapter.savePeople(this.people);
    } catch (err: any) {
      if (err?.name === "QuotaExceededError" || err?.code === 22) {
        throw new Error("Failed to save — storage may be full");
      }
      throw err;
    }
  }

  private persistHiddenSystemEvents(): void {
    try {
      this.adapter.saveHiddenSystemEventIds(
        Array.from(this.hiddenSystemEventIds),
      );
    } catch (err: any) {
      if (err?.name === "QuotaExceededError" || err?.code === 22) {
        throw new Error("Failed to save — storage may be full");
      }
      throw err;
    }
  }

  /** Merged view: user events + visible built-in Vietnamese holidays */
  getAllEventsForDisplay(): LunarEvent[] {
    const visibleHolidays = VIETNAMESE_HOLIDAYS.filter(
      (e) => !this.hiddenSystemEventIds.has(e.id),
    );
    return this.events.concat(visibleHolidays);
  }

  /** Create a new event */
  createEvent(form: EventFormData): void {
    // Validate via Core Engine
    validateEventCreationParams(
      { day: form.lunarDay, month: form.lunarMonth },
      form.leapMonthRule,
    );

    const newEvent: LunarEvent = {
      id: crypto.randomUUID(),
      name: form.name.trim().slice(0, 100),
      lunarDate: { day: form.lunarDay, month: form.lunarMonth },
      lunarYear:
        form.recurrence === RecurrenceRule.ONCE ? form.lunarYear : undefined,
      recurrence: form.recurrence,
      leapMonthRule: form.leapMonthRule,
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.events = addEvent(this.events, newEvent);
    this.persist();
    this.notify();
  }

  /** Update an existing event */
  editEvent(id: string, form: EventFormData): void {
    if (isSystemEventId(id)) {
      throw new Error("Không thể sửa lễ truyền thống");
    }
    validateEventCreationParams(
      { day: form.lunarDay, month: form.lunarMonth },
      form.leapMonthRule,
    );

    const existing = this.events.find((e) => e.id === id);
    if (!existing) throw new Error(`Event ${id} not found`);

    const updated: LunarEvent = {
      ...existing,
      name: form.name.trim().slice(0, 100),
      lunarDate: { day: form.lunarDay, month: form.lunarMonth },
      lunarYear:
        form.recurrence === RecurrenceRule.ONCE ? form.lunarYear : undefined,
      recurrence: form.recurrence,
      leapMonthRule: form.leapMonthRule,
      updatedAt: Date.now(),
    };

    this.events = updateEvent(this.events, updated);
    this.persist();
    this.notify();
  }

  /** Delete an event */
  deleteEvent(id: string): void {
    if (isSystemEventId(id)) {
      throw new Error("Không thể xóa lễ truyền thống. Hãy ẩn thay vì xóa.");
    }
    this.events = removeEvent(this.events, id);
    this.persist();
    this.notify();
  }

  /** Get occurrences for a specific year (merged user + visible holidays) */
  getOccurrencesForYear(year: number): UpcomingEventOccurrence[] {
    return calculateOccurrencesForYear(this.getAllEventsForDisplay(), year);
  }

  /** Get upcoming events from a reference date (merged user + visible holidays) */
  getUpcoming(
    referenceSolar: SolarDate,
    limit: number,
  ): UpcomingEventOccurrence[] {
    return getUpcomingEvents(this.getAllEventsForDisplay(), referenceSolar, limit);
  }

  /** Export user events + memos + settings payload */
  exportPayload(): string {
    const payload = generateExportPayload(
      this.events,
      this.memos,
      Array.from(this.hiddenSystemEventIds),
      this.people,
    );
    return JSON.stringify(payload, null, 2);
  }

  // ---- System Events API ----

  /**
   * Returns the full list of built-in holidays along with their hidden state,
   * for rendering the settings toggle list.
   */
  getSystemEventsWithVisibility(): Array<{ event: LunarEvent; hidden: boolean }> {
    return VIETNAMESE_HOLIDAYS.map((event) => ({
      event,
      hidden: this.hiddenSystemEventIds.has(event.id),
    }));
  }

  setSystemEventHidden(id: string, hidden: boolean): void {
    if (!isSystemEventId(id)) {
      throw new Error(`${id} is not a system event`);
    }
    if (hidden) {
      this.hiddenSystemEventIds.add(id);
    } else {
      this.hiddenSystemEventIds.delete(id);
    }
    this.persistHiddenSystemEvents();
    this.notify();
  }

  setAllSystemEventsHidden(hidden: boolean): void {
    if (hidden) {
      this.hiddenSystemEventIds = new Set(VIETNAMESE_HOLIDAYS.map((e) => e.id));
    } else {
      this.hiddenSystemEventIds = new Set();
    }
    this.persistHiddenSystemEvents();
    this.notify();
  }

  /** Import events from JSON string (F4: async-friendly for large imports) */
  async importFromJson(
    json: string,
    replaceAll: boolean = false,
  ): Promise<{ added: number; updated: number; skipped: number }> {
    // validateImportPayload takes raw JSON string, throws on invalid
    const payload = validateImportPayload(json);

    if (replaceAll) {
      this.events = [];
      this.memos = [];
      this.people = [];
      this.hiddenSystemEventIds = new Set();
    }

    const eventsBefore = this.events.length;
    const memosBefore = this.memos.length;
    const peopleBefore = this.people.length;

    // F4: For large imports (500+), batch in chunks to avoid UI freeze
    if (payload.events.length > 100) {
      const BATCH_SIZE = 100;
      for (let i = 0; i < payload.events.length; i += BATCH_SIZE) {
        const batch = payload.events.slice(i, i + BATCH_SIZE);
        this.events = importEvents(this.events, batch);
        // Yield to event loop between batches
        if (i + BATCH_SIZE < payload.events.length) {
          await new Promise((resolve) => setTimeout(resolve, 0));
        }
      }
    } else {
      this.events = importEvents(this.events, payload.events);
    }

    if (payload.memos && payload.memos.length > 0) {
      this.memos = importMemos(this.memos, payload.memos);
    }

    if (payload.people && payload.people.length > 0) {
      this.people = importPeople(this.people, payload.people);
    }

    if (payload.settings?.hiddenSystemEventIds) {
      for (const id of payload.settings.hiddenSystemEventIds) {
        this.hiddenSystemEventIds.add(id);
      }
    }

    const eventsAfter = this.events.length;
    const memosAfter = this.memos.length;
    const peopleAfter = this.people.length;

    this.persist();
    this.persistMemos();
    this.persistPeople();
    this.persistHiddenSystemEvents();
    this.notify();

    return {
      added:
        Math.max(0, eventsAfter - eventsBefore) +
        Math.max(0, memosAfter - memosBefore) +
        Math.max(0, peopleAfter - peopleBefore),
      updated: 0,
      skipped: 0,
    };
  }

  // ---- Quick Memo API ----

  getMemos(): QuickMemo[] {
    return this.memos;
  }

  getMemosGroupedByTitle(): GroupedMemos[] {
    return groupMemosByTitle(this.memos);
  }

  createMemo(form: MemoFormData): void {
    validateMemoCreationParams(
      form.title,
      form.solarYear,
      form.solarMonth,
      form.solarDay,
    );

    const newMemo: QuickMemo = {
      id: crypto.randomUUID(),
      title: form.title.trim().slice(0, 100),
      note: (form.note ?? "").trim().slice(0, 500),
      solarDate: {
        year: form.solarYear,
        month: form.solarMonth,
        day: form.solarDay,
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    this.memos = addMemo(this.memos, newMemo);
    this.persistMemos();
    this.notify();
  }

  editMemo(id: string, form: MemoFormData): void {
    validateMemoCreationParams(
      form.title,
      form.solarYear,
      form.solarMonth,
      form.solarDay,
    );

    const existing = this.memos.find((m) => m.id === id);
    if (!existing) throw new Error(`Memo ${id} not found`);

    const updated: QuickMemo = {
      ...existing,
      title: form.title.trim().slice(0, 100),
      note: (form.note ?? "").trim().slice(0, 500),
      solarDate: {
        year: form.solarYear,
        month: form.solarMonth,
        day: form.solarDay,
      },
      updatedAt: Date.now(),
    };

    this.memos = updateMemo(this.memos, updated);
    this.persistMemos();
    this.notify();
  }

  deleteMemo(id: string): void {
    this.memos = removeMemo(this.memos, id);
    this.persistMemos();
    this.notify();
  }

  // ---- Family Tree (Gia phả) API ----

  getPeople(): Person[] {
    return this.people;
  }

  getFamilyTree(): FamilyTreeNode[] {
    return buildFamilyTree(this.people);
  }

  private toPartialDate(
    date: PersonFormData["birthDate"],
  ): PartialDate | null {
    if (!date) return null;
    return { year: date.year, month: date.month, day: date.day };
  }

  /** Build a fresh Person from form data (id/timestamps + default relations). */
  private buildPerson(form: PersonFormData): Person {
    const birthDate = this.toPartialDate(form.birthDate);
    const deathDate = form.isDeceased ? this.toPartialDate(form.deathDate) : null;
    validatePersonCreationParams(form.name, birthDate, deathDate);
    const now = Date.now();
    return {
      id: crypto.randomUUID(),
      name: form.name.trim().slice(0, 100),
      gender: form.gender,
      birthDate,
      isDeceased: form.isDeceased,
      deathDate,
      isMarriedIn: false,
      parentId: null,
      spouseId: null,
      notes: (form.notes ?? "").trim().slice(0, 500),
      createdAt: now,
      updatedAt: now,
    };
  }

  /** Add the first/root blood person (only meaningful when the tree is empty). */
  addRootPerson(form: PersonFormData): void {
    this.people = addPerson(this.people, this.buildPerson(form));
    this.persistPeople();
    this.notify();
  }

  /** Add a blood child under an existing person. */
  addChild(parentId: string, form: PersonFormData): void {
    this.people = attachChild(this.people, parentId, this.buildPerson(form));
    this.persistPeople();
    this.notify();
  }

  /** Add a married-in spouse to a blood person. */
  addSpouse(personId: string, form: PersonFormData): void {
    this.people = attachSpouse(this.people, personId, this.buildPerson(form));
    this.persistPeople();
    this.notify();
  }

  /** Add a blood parent above an existing person (which becomes a child). */
  addParent(childId: string, form: PersonFormData): void {
    this.people = attachParent(this.people, childId, this.buildPerson(form));
    this.persistPeople();
    this.notify();
  }

  editPerson(id: string, form: PersonFormData): void {
    const birthDate = this.toPartialDate(form.birthDate);
    const deathDate = form.isDeceased ? this.toPartialDate(form.deathDate) : null;
    validatePersonCreationParams(form.name, birthDate, deathDate);

    const existing = this.people.find((p) => p.id === id);
    if (!existing) throw new Error(`Person ${id} not found`);

    // Only personal info changes here; relationship fields are preserved.
    const updated: Person = {
      ...existing,
      name: form.name.trim().slice(0, 100),
      gender: form.gender,
      birthDate,
      isDeceased: form.isDeceased,
      deathDate,
      notes: (form.notes ?? "").trim().slice(0, 500),
      updatedAt: Date.now(),
    };

    this.people = updatePerson(this.people, updated);
    this.persistPeople();
    this.notify();
  }

  deletePerson(id: string): void {
    this.people = removePersonCascade(this.people, id);
    this.persistPeople();
    this.notify();
  }
}

import { LeapMonthRule, RecurrenceRule } from '../core/models/types';
import type { LunarEvent, SolarDate, UpcomingEventOccurrence, LunarDateContext } from '../core/models/types';
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
} from '../lib/index';
import type { StorageAdapter } from '../adapters/storage/local-storage-adapter';
import type { EventFormData } from './types';

export type StateListener = () => void;

/**
 * Application state manager.
 * Loads events from StorageAdapter on init and provides
 * reactive re-render hooks for UI components.
 */
export class AppState {
    private events: LunarEvent[] = [];
    private listeners: StateListener[] = [];
    private adapter: StorageAdapter;
    private _corruptedOnLoad = false;

    constructor(adapter: StorageAdapter) {
        this.adapter = adapter;
        this.events = adapter.load();
        // Detect if data was empty due to corruption
        const raw = localStorage.getItem('am-lich-events');
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
            this.listeners = this.listeners.filter(l => l !== listener);
        };
    }

    private notify(): void {
        this.listeners.forEach(l => l());
    }

    private persist(): void {
        try {
            this.adapter.save(this.events);
        } catch (err: any) {
            // F3: Surface storage failure to caller for toast handling
            if (err?.name === 'QuotaExceededError' || err?.code === 22) {
                throw new Error('Failed to save — storage may be full');
            }
            throw err;
        }
    }

    /** Create a new event */
    createEvent(form: EventFormData): void {
        // Validate via Core Engine
        validateEventCreationParams({ day: form.lunarDay, month: form.lunarMonth }, form.leapMonthRule);

        const newEvent: LunarEvent = {
            id: crypto.randomUUID(),
            name: form.name.trim().slice(0, 100),
            lunarDate: { day: form.lunarDay, month: form.lunarMonth },
            lunarYear: form.recurrence === RecurrenceRule.ONCE ? form.lunarYear : undefined,
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
        validateEventCreationParams({ day: form.lunarDay, month: form.lunarMonth }, form.leapMonthRule);

        const existing = this.events.find(e => e.id === id);
        if (!existing) throw new Error(`Event ${id} not found`);

        const updated: LunarEvent = {
            ...existing,
            name: form.name.trim().slice(0, 100),
            lunarDate: { day: form.lunarDay, month: form.lunarMonth },
            lunarYear: form.recurrence === RecurrenceRule.ONCE ? form.lunarYear : undefined,
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
        this.events = removeEvent(this.events, id);
        this.persist();
        this.notify();
    }

    /** Get occurrences for a specific year */
    getOccurrencesForYear(year: number): UpcomingEventOccurrence[] {
        return calculateOccurrencesForYear(this.events, year);
    }

    /** Get upcoming events from a reference date */
    getUpcoming(referenceSolar: SolarDate, limit: number): UpcomingEventOccurrence[] {
        return getUpcomingEvents(this.events, referenceSolar, limit);
    }

    /** Export events payload */
    exportPayload(): string {
        const payload = generateExportPayload(this.events);
        return JSON.stringify(payload, null, 2);
    }

    /** Import events from JSON string (F4: async-friendly for large imports) */
    async importFromJson(json: string): Promise<{ added: number; updated: number; skipped: number }> {
        // validateImportPayload takes raw JSON string, throws on invalid
        const payload = validateImportPayload(json);

        const before = this.events.length;

        // F4: For large imports (500+), batch in chunks to avoid UI freeze
        if (payload.events.length > 100) {
            const BATCH_SIZE = 100;
            for (let i = 0; i < payload.events.length; i += BATCH_SIZE) {
                const batch = payload.events.slice(i, i + BATCH_SIZE);
                this.events = importEvents(this.events, batch);
                // Yield to event loop between batches
                if (i + BATCH_SIZE < payload.events.length) {
                    await new Promise(resolve => setTimeout(resolve, 0));
                }
            }
        } else {
            this.events = importEvents(this.events, payload.events);
        }

        const after = this.events.length;

        this.persist();
        this.notify();

        return {
            added: Math.max(0, after - before),
            updated: 0,
            skipped: 0,
        };
    }
}

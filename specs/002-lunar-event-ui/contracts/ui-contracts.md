# UI Contracts: Lunar Event Manager UI

**Feature**: 002-lunar-event-ui  
**Date**: 2026-02-22  

## StorageAdapter Contract

The UI layer communicates with persistence through this interface. Implementations (localStorage, IndexedDB, etc.) must conform exactly.

```typescript
interface StorageAdapter {
  /**
   * Loads all stored events. Returns an empty array if no data exists.
   * MUST NOT throw — returns [] on any read failure.
   */
  load(): LunarEvent[];

  /**
   * Replaces all events in storage with the provided array.
   * MUST throw if the write operation fails (e.g., storage full).
   */
  save(events: LunarEvent[]): void;
}
```

### Behavioral Contract

| Scenario | Expected Behavior |
|----------|-------------------|
| First run, no stored data | `load()` returns `[]` |
| After `save([event1, event2])` | `load()` returns `[event1, event2]` |
| Storage quota exceeded on `save()` | Throws `Error` with descriptive message |
| Corrupted JSON in storage | `load()` returns `[]` (graceful degradation) |

## View Layer Contract

### Calendar View

| Input | Output |
|-------|--------|
| `year: number`, `month: number`, `events: LunarEvent[]` | `CalendarViewModel` with 35–42 cells, each annotated with matching occurrences |
| Month navigation (prev/next) | Re-computes `CalendarViewModel` from Core Engine API for new month |

### Upcoming Events View

| Input | Output |
|-------|--------|
| `events: LunarEvent[]`, `referenceDate: SolarDate`, `limit: number` | Sorted `UpcomingEventOccurrence[]` via Core Engine API |

### Event Form

| Action | Validation | Persistence |
|--------|------------|-------------|
| Create | Core Engine validation API → accept or reject | `addEvent()` → `StorageAdapter.save()` |
| Edit | Core Engine validation API → accept or reject | `updateEvent()` → `StorageAdapter.save()` |
| Delete | Confirmation dialog | `removeEvent()` → `StorageAdapter.save()` |

### Import/Export

| Action | Flow |
|--------|------|
| Export | `StorageAdapter.load()` → Core Engine export API → Blob download |
| Import | File upload → Core Engine validation API → Core Engine import API → `StorageAdapter.save()` |

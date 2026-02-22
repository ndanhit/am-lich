# Interface Contracts: Lunar Event Manager Core API

The following defines the stable, deterministic function signatures (contracts) exposed by the Core Engine. These conform to the architectural guidelines that external adapters and frameworks will depend upon.

## 1. Domain Types

```typescript
export type LunarDate = {
  day: number;   // 1-30
  month: number; // 1-12
};

export type LeapMonthRule = 'REGULAR_ONLY' | 'LEAP_ONLY' | 'BOTH';

export type LunarEvent = {
  id: string; // UUID v4
  name: string;
  lunarDate: LunarDate;
  leapMonthRule: LeapMonthRule;
  updatedAt: number; // Unix timestamp ms
  createdAt: number; // Unix timestamp ms
};

export type SolarDate = {
  year: number;
  month: number;
  day: number;
};

export type UpcomingEventOccurrence = {
  event: LunarEvent;
  solarDate: SolarDate;
  isLeapMonthOccurrence: boolean;
  daysUntil: number;
};
```

## 2. Core Engine Computations (Pure Functions)

These functions must be fully deterministic and take no dependencies on external APIs, Time (like `new Date()`), or Storage APIs.

### `calculateOccurrencesForYear(event: LunarEvent, year: number): SolarDate[]`
Calculates exactly when the event occurs in the target Gregorian year based on its `leapMonthRule`.
- **Returns**: array of 0, 1, or 2 Gregorian dates.
  - `[]` (e.g., leap month event in a non-leap year)
  - `[date]` (normal month hit, or leap month hit)
  - `[date1, date2]` (both rule triggered, month had a leap variation)

### `getUpcomingEvents(events: LunarEvent[], referenceDate: SolarDate, limit: number = 30): UpcomingEventOccurrence[]`
Calculates and orders the chronological next occurrences for an array of events from a given reference solar date.
- **Reference Date**: Must be supplied as an argument (no `Date.now()` inside).
- **Limit**: Caps the computational workload to find the next N events.
- **Returns**: Ascending sorted array of `UpcomingEventOccurrence`.

## 3. Data Integration (Pure Functions)

### `importEvents(existingData: LunarEvent[], importedData: LunarEvent[]): LunarEvent[]`
Takes two collections and merges them deterministically according to the Import Conflict Strategy.
- **Behavior**: 
  - Compare by `id`.
  - If imported ID exists and `DeepEqual(existingData, importedData)` fails -> replace with imported.
  - If imported ID doesn't exist -> push.
  - Return **NEW** array instance (no side-effects/mutations on arguments).

### `validateExportPayload(data: unknown): Error | LunarEvent[]`
Determines if an incoming string/JSON structure is a valid Export file matching the schemas outlined. Returns a parsed valid array or an Error.

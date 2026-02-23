# Data Model: User Feedback Resolution

## GroupedUpcoming (UI Layer)

This entity represents the upcoming list grouped by year.

| Field | Type | Description |
|-------|------|-------------|
| `solarYear` | `number` | The grouping year (e.g., 2026) |
| `occurrences` | `UpcomingEventOccurrence[]` | List of events falling in this solar year |

## NavigationState (UI Layer)

Controls the month-navigation view logic.

| Field | Type | Description |
|-------|------|-------------|
| `currentYear` | `number` | Current year being viewed |
| `currentMonth` | `number` | Current month being viewed |
| `direction` | `-1 | 0 | 1` | Direction of transition (animation context) |

## EventImportPayload (Data Sync)

The structure of the imported JSON file.

| Field | Type | Description |
|-------|------|-------------|
| `events` | `LunarEvent[]` | Array of events to be imported |
| `source` | `string` | identifier (optional) |
| `timestamp` | `number` | Export time |

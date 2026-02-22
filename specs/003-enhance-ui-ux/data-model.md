# Data Model: Enhanced UI/UX

## CalendarCell (UI Layer)

This entity represents a single cell in the calendar grid. It combines domain data from the Core Engine with UI-specific flags.

| Field | Type | Source | Description |
|-------|------|--------|-------------|
| `solarDate` | `SolarDate` | Domain | Year, Month, Day |
| `lunarDay` | `number` | Domain | Lunar day (1-30) |
| `lunarMonth` | `number` | Domain | Lunar month (1-12) |
| `lunarYear` | `number` | Domain | Lunar year |
| `canChiYear` | `string` | Domain | Vietnamese Can Chi name |
| `isLeapMonth` | `boolean` | Domain | If this month is a leap month |
| `isToday` | `boolean` | UI Agent | Matches current system date |
| `isCurrentMonth` | `boolean` | UI Agent | Matches currently viewed month |
| `isFirstDayOfLunar` | `boolean` | UI Agent | `lunarDay === 1` |
| `events` | `LunarEvent[]` | State | All events recurring on this lunar date |

## CanChiLookup (Shared)

A mapping object defined in `CoreEngine`.

```typescript
type CanChiMapping = Record<string, string>; // Chinese character -> Vietnamese name
```

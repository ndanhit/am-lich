# Data Model: Lunar Event Manager

## 1. Value Objects

### `LunarDate`
Represents a specific point in the lunar calendar, not tied to a specific year.
- `day`: number (1-30)
- `month`: number (1-12)

### `LeapMonthRule`
Defines how the recurring event behaves regarding leap months.
*(Enum Types)*
- `'REGULAR_ONLY'`
- `'LEAP_ONLY'`
- `'BOTH'`

### `SolarDate`
Represents a specific point in the standard Gregorian calendar.
- `year`: number
- `month`: number (1-12)
- `day`: number (1-31)

## 2. Entities

### `LunarEvent`
The aggregate root representing a recurring event configured by the user.
- `id`: string (UUID, uniquely identifies the event across devices)
- `name`: string
- `lunarDate`: `LunarDate` (embedded object)
- `leapMonthRule`: `LeapMonthRule`
- `updatedAt`: number (Timestamp in ms, used for potential sync conflict detection, though our spec strictly says ID match with different content overwrites. Still a best practice.)
- `createdAt`: number 

### `UpcomingEventOccurrence`
A computed projection. Never stored.
- `eventId`: string (Reference to LunarEvent)
- `eventName`: string
- `solarDate`: `SolarDate`
- `isLeapMonthOccurrence`: boolean (Flags if this specific recurrence happened during a leap month)
- `daysUntil`: number (Calculated offset from reference date)

## 3. Data Transfer Objects (DTOs)

### `ExportPayload`
The root structure for the offline exported file.
- `version`: string (e.g. "1.0")
- `exportedAt`: number
- `events`: Array of `LunarEvent`

## 4. Validation Rules
- **LunarEvent.name**: Must not be empty. Max length 120.
- **LunarDate.day**: Must be 1 <= x <= 30.
- **LunarDate.month**: Must be 1 <= x <= 12.
- **LeapMonthRule**: Must strictly belong to the enum values.
- **UpcomingEventOccurrence.solarDate**: Computed dates must be valid Gregorian dates.

## 5. Domain Logic / Rules
- **Import Determinism Rule**: Given a List of `ExistingEvents` and `ImportedEvents`: Iteratively insert `ImportedEvents`. If ID exists, and deep inequality exists, OVERWRITE existing with imported. If ID exists and structures are deep equal, SKIP.
- **Recurrence Computation Rule**: Given a `LunarEvent` and `Year`: 
  - If `leapMonthRule` === `REGULAR_ONLY`, check the base month. If the month has leap, ignore it completely.
  - If `leapMonthRule` === `LEAP_ONLY`, check if `Year` has a leap month equal to `lunarDate.month`. If yes, returns the target date. If no, skip (returns null/undefined).
  - If `leapMonthRule` === `BOTH`, calculate the base month, AND check for leap variation. Returns 1 OR 2 `SolarDate` occurrences for that year.

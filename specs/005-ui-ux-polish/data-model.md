# Data Model: UI/UX Refinement & Bug Fixes

## UI State Entities

### `MonthNavigationState`
Represents the state of scroll-based month transitions.
- `lastScrollTime`: `number` (Timestamp) - Used for debouncing.
- `isTransitioning`: `boolean` - Flag to ignore events during animations.
- `scrollThreshold`: `number` (pixels) - Minimum delta to trigger a month change.

### `CalendarCell` (Updated)
- `isSunday`: `boolean` - Flag for red highlighting.
- `dayOfWeek`: `number` (0-6, where 0 is Monday).

## Logic Transitions

### `ScrollToMonth`
1. Capture `wheel` or `touch` event.
2. Check if `isTransitioning` or `lastScrollTime` is within the lockout period (300ms).
3. Determine direction (Vertical Delta Y).
4. Call `state.setYearMonth(newYear, newMonth)`.
5. Trigger fade-in animation on the calendar grid.

### `MondayStartShift`
1. Get `firstDayOfMonth` (0 = Sunday).
2. Calculate leading days: `(firstDayOfMonth + 6) % 7`.
3. Fill 42-cell grid accordingly.

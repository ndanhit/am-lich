# Research Findings: User Feedback Resolution

## Decision 1: Event Import Behavior
**Decision**: Switch from merge logic to "Replace All" with explicit user confirmation.
**Rationale**: The user explicitly requested "xóa all sự kiện đang có và import các sự kiện từ file vào". The current merge logic in `importEvents` only overwrites if the imported `updatedAt` is strictly greater, which confuses users who expect a clean slate.
**Alternatives considered**: 
- Conflict resolution UI (Too complex, violates simplicity principle).
- Merge by default, replace on flag (Adds unnecessary API surface).

## Decision 2: Calendar Swipe Navigation
**Decision**: Use a CSS `scroll-snap` implementation in a horizontal container, or a manual `transition` based on a `currentMonth` state shift.
**Rationale**: CSS `scroll-snap` is the most performant way to achieve discrete "page-flip" behavior. However, since the calendar re-renders monthly, pre-rendering adjacent months into a 3pane view (Prev | Current | Next) and using `transform: translateX()` is better for absolute <100ms control.
**Alternatives considered**: 
- `scroll-snap`: Harder to coordinate with the current monthly re-render logic.

## Decision 3: Year Grouping in Upcoming
**Decision**: Group events in `getUpcoming` or in the view component helper.
**Rationale**: Sorting and grouping should ideally happen in the `renderUpcomingList` component to keep the query layer pure and focused on fetching.
**Alternatives considered**: 
- Grouping in the `getUpcoming` query (Violates separation of concerns between data and presentation).

## Decision 4: Mobile Font Scaling
**Decision**: Increase `.day-number` font size to `var(--font-size-lg)` on mobile media query.
**Rationale**: Native mobile calendars emphasize the date. Current relative scaling is insufficient.

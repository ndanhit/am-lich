# Quickstart: User Feedback Resolution Implementation

## Navigation Overhaul
- **Revert**: Remove `wheel` and `touchstart/move/end` vertical scroll listeners in `app.ts`.
- **Buttons**: Restore `prev/next` event listeners in `app.ts` calling `navigateMonth`.
- **Swipe**: Implement `scroll-snap-x` on a container wrapping 3 month views (Prev, Current, Next) for instant <100ms feel.

## Upcoming List Grouping
- **Function**: `renderUpcomingList` in `upcoming-list.ts`.
- **Logic**: Use a `Map<number, UpcomingEventOccurrence[]>` to group by `occ.solarDate.year`.
- **UI**: Add `<div class="year-header sticky">Năm ${year}</div>` before each group.

## Import Safety & Fix
- **Component**: `import-export.ts`.
- **Flow**: Add `showConfirm` (via `app.ts` callback) before `state.importFromJson`.
- **Persistence**: Ensure `state.importFromJson` correctly sets `this.events` and calls `this.persist()` (already exists in code, but needs verification if `batching` logic has a race condition).

## Mobile CSS
- **Path**: `src/ui/styles/index.css`.
- **Target**: `@media (max-width: 768px) { .day-number { font-size: 20px; } }`.

## Traditional Formatting
- **Path**: `src/lib/formatters.ts`.
- **Function**: `formatLunarDate`.
- **Logic**: `lunarDay <= 10 ? 'Mùng ' + lunarDay : 'ngày ' + lunarDay`.

# Quickstart: Day Detail Modal

## Prerequisites
- Core engine conversion logic must be updated to export fortune data.
- Lunar javascript library is available.

## Integration
The modal is triggered from the calendar grid cells in `src/ui/views/app.ts`.

```typescript
// Example usage in app.ts
function onCellClick(cell: CalendarCell) {
    renderDayDetailModal(modalContainer, cell.date, state, (newDate) => {
        // Callback when date changes if needed
    });
}
```

## Testing Logic
Verify that:
1. Modal opens for any day (with or without events).
2. Navigation arrows update Section 1, 2, and 3 correctly.
3. Native date picker jumps to the selected date.
4. "Add Event" button opens the creation form with the `activeSolarDate` pre-filled.

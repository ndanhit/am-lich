# UI Contracts: Month Swipe & Navigation

## Month Transition Interface

The `renderCalendar` function is extended to handle horizontal navigation context.

```typescript
interface CalendarNavigationContext {
    onNavigate: (direction: -1 | 1) => void;
    currentMonth: number;
    currentYear: number;
    isTransitioning: boolean;
}
```

## Upcoming List Grouping Contract

The `renderUpcomingList` will now expect data structured for year headers.

```typescript
interface GroupedUpcomingEvents {
    year: number;
    events: UpcomingEventOccurrence[];
}
```

## Import Warning Contract

The `import-export.ts` component must invoke a confirmation dialog before calling `state.importFromJson`.

```typescript
// Proposed logic
if (window.confirm("Hành động này sẽ xóa tất cả sự kiện hiện tại và thay thế bằng dữ liệu mới. Bạn có chắc chắn muốn tiếp tục?")) {
    await state.importFromJson(text, { replace: true });
}
```

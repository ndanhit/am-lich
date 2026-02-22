# Quickstart: UI/UX Interactions

## Styling Guidelines

- **Primary Accent**: Use `--color-accent` (#ff6b9d) for highlighting the 1st day of the lunar month.
- **Hover/Tap**:
  - Pointer: `transition: background var(--transition-fast)`
  - Touch: `active: transform scale(0.98)`
- **Animations**:
  - Month navigation: 250ms slide-fade transition.
  - Detail panel: 300ms bottom-to-top slide.

## Component Patterns

### Settings Overlay
Reuse the `modal-overlay` pattern but ensure it behaves as a bottom sheet:
```html
<div class="modal-overlay bottom-sheet">
  <div class="modal-content bottom-sheet-content">
    ...
  </div>
</div>
```

### Calendar Grid
Always generate 42 items.
```typescript
const grid = [
  ...prevMonthDays, // Muted
  ...currentMonthDays, // Prominent
  ...nextMonthDays  // Muted
];
```

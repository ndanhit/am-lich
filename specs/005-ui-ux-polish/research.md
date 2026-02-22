# Research: UI/UX Refinement & Bug Fixes

## Unknowns

- [ ] How to implement smooth vertical month transitions without heavy libraries (e.g., using `scroll-snap` or manual event throttling)?
- [ ] What is the most efficient way to shift the existing Sunday-start grid logic to Monday-start in `calendar.ts`?
- [ ] How to reliably detect "current month" to toggle FAB visibility without frequent re-renders?
- [ ] Why does the native date picker fail on mobile touch, and what is the standard fix for `.showPicker()` in mobile browsers?

## Findings

### Vertical Scroll Navigation
*Task: Research native scroll vs. custom wheel/touch handling for month transitions:*
- Decision: Use a custom `wheel` and `touchstart/move/end` handler with a debounce/throttle (approx 300ms) to trigger month state changes.
- Rationale: `scroll-snap` is excellent for static content, but our calendar grid dynamically re-renders its content. Manual event handling provides better control over the "transitioning" state and prevents multiple month jumps on high-sensitivity trackpads.

### Monday-Start Grid Logic
*Task: Analyze existing Sunday-start implementation:*
- Decision: Adjust the `buildCalendarViewModel` logic to calculate the shift: `(dayOfWeek + 6) % 7`.
- Rationale: This is the standard mathematical shift to move the start of the week from Sunday (0) to Monday (1).

### Mobile Font Scaling
*Task: Research CSS scaling for calendar numbers:*
- Decision: Use a CSS variable for font-size and update it within a `@media (max-width: 768px)` block using a 1.2x multiplier.
- Rationale: Simple, maintainable, and adheres to the existing design system.

### Mobile Date Picker Bug
*Task: Debug `showPicker()` behavior on mobile browsers:*
- Decision: Ensure `picker.showPicker()` is called directly within a user interaction event (e.g., `click` or `touchend`) without any async delays.
- Rationale: Mobile browsers (Safari/Chrome) often block `.showPicker()` if it's not strictly synchronous with a user gesture.

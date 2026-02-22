# Tasks: UI/UX Refinement & Bug Fixes (005-ui-ux-polish)

**Input**: Design documents from `/specs/005-ui-ux-polish/`
**Prerequisites**: plan.md, spec.md, research.md, data-model.md

## Implementation Strategy
- **Foundational**: Update state and models to support new navigation and grid logic.
- **MVP (US1 & US2)**: Implement scroll navigation and the "Hôm nay" shortcut. This represents the primary functional change.
- **Refinement (US3 & US4)**: Adjust grid layout to Monday-start and polish mobile readability.
- **Cleanup (US5)**: Remove inaccurate data sections.

---

## Phase 1: Setup
**Purpose**: Verify project state.

- [x] T001 Verify project build and test status (`npm run build:ui` and `npm run test`)

---

## Phase 2: Foundational (Blocking Prerequisites)
**Purpose**: Prepare state and models for navigation and grid changes.

- [x] T002 Implement `MonthNavigationState` for scroll debouncing/lockout in `src/ui/views/app.ts`
- [x] T003 [P] Update `CalendarCell` interface in `src/ui/types.ts` to include `isSunday` and `dayOfWeek`

---

## Phase 3: User Story 1 - Continuous Scroll Navigation (Priority: P1) 🎯 MVP
**Goal**: Navigate between months using vertical scroll (up/down).

**Independent Test**: Remove navigation buttons, scroll up/down on the calendar, and verify month transitions.

- [x] T004 [US1] Remove left/right navigation buttons from the header in `src/ui/views/app.ts`
- [x] T005 [US1] Implement `wheel` event handler for desktop scroll-to-month in `src/ui/views/app.ts`
- [x] T006 [US1] Implement `touchstart`/`touchmove`/`touchend` handlers for mobile swipe-to-month in `src/ui/views/app.ts`
- [x] T007 [US1] Add scroll debouncing (300ms) and `isTransitioning` lockout logic in `src/ui/views/app.ts`
- [x] T008 [P] [US1] Add fade-in transition animation to the calendar grid in `src/ui/styles/index.css`

---

## Phase 4: User Story 2 - Floating "Today" Button (Priority: P1)
**Goal**: A shortcut button to return to the current month when scrolled away.

**Independent Test**: Scroll away from "Today", verify the floating button appears, click it, and verify return to current month.

- [x] T009 [US2] Create Floating Action Button (FAB) container and element in `src/ui/views/app.ts`
- [x] T010 [US2] Implement conditional visibility logic for FAB (View Month != Current Month) in `src/ui/views/app.ts`
- [x] T011 [P] [US2] Style FAB (fixed position, accent-bg, shadow) in `src/ui/styles/index.css`
- [x] T012 [US2] Wire up FAB click event to trigger jump back to current month in `src/ui/views/app.ts`

---

## Phase 5: User Story 3 - Monday-Start Grid & Sunday Highlighting (Priority: P2)
**Goal**: Start the week on Monday and highlight Sundays in red.

**Independent Test**: Verify the first column is Monday and the Sunday column header/dates are red.

- [x] T013 [US3] Update `buildCalendarViewModel` in `src/ui/components/calendar.ts` to shift logic from Sunday-start to Monday-start
- [x] T014 [US3] Update calendar header row titles (T2 -> CN) in `src/ui/components/calendar.ts`
- [x] T015 [P] [US3] Apply red highlighting logic (`--color-accent`) for Sunday column in `src/ui/styles/index.css`

---

## Phase 6: User Story 4 - Mobile Readability & Bug Fixes (Priority: P2)
**Goal**: Increase font sizes on mobile and fix the date picker in Day Detail Modal.

**Independent Test**: Inspect font sizes on mobile viewport (<768px); verify date picker opens on mobile touch.

- [x] T016 [P] [US4] Implement CSS variable font scaling (1.2x) via `@media (max-width: 768px)` in `src/ui/styles/index.css`
- [x] T017 [US4] Fix Day Detail Modal date picker by ensuring synchronous touch event binding in `src/ui/components/day-detail-modal.ts`

---

## Phase 7: User Story 5 - Cleanup (Priority: P3)
**Goal**: Remove inaccurate Section 2 (Fortune Info) from Day Detail Modal.

**Independent Test**: Open Day Detail Modal and confirm "Fortune Info" section is gone.

- [x] T018 [US5] Remove "Fortune Info" (Section 2) rendering logic from `src/ui/components/day-detail-modal.ts`
- [x] T019 [P] [US5] Clean up unused CSS classes related to fortune section in `src/ui/styles/day-detail-modal.css`

---

## Phase 8: Polish & Cross-Cutting Concerns
**Purpose**: Final verification and documentation.

- [ ] T020 Final scroll performance and event listener cleanup audit
- [ ] T021 Update `walkthrough.md` with new navigation and grid screenshots/recordings

---

## Dependencies & Execution Order

### Phase Dependencies
- **Phase 1-2**: Blocking Foundational tasks.
- **Phase 3 (US1)**: Blocks US2 (FAB visibility logic depends on scroll state).
- **Phases 4-7**: Can proceed in parallel after Phase 3 is stable.

### Parallel Opportunities
- CSS styling (T008, T011, T015, T016) can run in parallel with TS implementation.
- Monday-start logic (Phase 5) is independent of scroll navigation (Phase 3).
- Data removal (Phase 7) is independent and low-risk.

---

## Implementation Strategy

### MVP First
1. Setup and Foundational (Phase 1-2).
2. Continuous Scroll (Phase 3).
3. Floating "Today" Button (Phase 4).
**STOP and VALIDATE**: Test navigation flow on desktop and mobile.

### Incremental Delivery
1. Add Monday-start grid (Phase 5).
2. Apply mobile refinements (Phase 6).
3. Final cleanup (Phase 7).

---
description: "Apple Store UI/UX Redesign Implementation Tasks"
---

# Tasks: Apple Store UI/UX Redesign

**Input**: Design documents from `/specs/001-apple-store-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, quickstart.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure. 

- [x] T001 Define core typography CSS variables in `src/ui/styles/main.css` based on research.md.
- [x] T002 Define core spacing and border-radius CSS variables in `src/ui/styles/main.css`.
- [x] T003 [P] Define core animation easing CSS variables in `src/ui/styles/main.css`.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented.

- [x] T004 Apply the new high-level background color (`#f5f5f7`) and global font-family changes to `body` in `src/ui/styles/main.css`.
- [x] T005 Strip away old default border styles across global elements to prepare for card-based designs in `src/ui/styles/main.css`.

---

## Phase 3: User Story 1 - Premium Visual Presentation (Priority: P1) 🎯 MVP

**Goal**: The lunar calendar interface must feel like browsing an Apple product page, with smooth animations, large readable typography, and soft layouts.

**Independent Test**: Build the app, open the local server, and verify the calendar grid headers, dates, and background closely match the Apple aesthetic.

### Implementation for User Story 1

- [x] T006 [US1] Update `src/ui/styles/calendar.css` to apply new typography scales to the month/year headers.
- [x] T007 [P] [US1] Refactor the main calendar grid in `src/ui/styles/calendar.css` to use the defined card border-radius style.
- [x] T008 [P] [US1] Refactor `src/ui/views/app.ts` to ensure calendar container elements map correctly to the new CSS classes, if necessary.
- [x] T009 [US1] Add subtle hover transition effects (`transform`, `box-shadow`) to calendar cells in `src/ui/styles/calendar.css`.

---

## Phase 4: User Story 2 - Card-based Event Interactions (Priority: P2)

**Goal**: Events and item lists are displayed as distinct, rounded-corner white cards on the light gray background.

**Independent Test**: Build the app, open the "Sắp tới" (Upcoming) tab, and verify that events list elements have proper card encapsulation and transition smoothly when clicked.

### Implementation for User Story 2

- [x] T010 [US2] Update `src/ui/styles/form.css` to apply card styling (white background, border-radius, subtle shadow) to upcoming event lists.
- [x] T011 [P] [US2] Update `src/ui/styles/day-detail-modal.css` to implement the Apple-style sliding/scaling smooth modal transitions.
- [x] T012 [P] [US2] Update button stylings in `src/ui/styles/form.css` to match the premium flat/rounded style.
- [x] T013 [US2] Ensure overlays in `src/ui/styles/day-detail-modal.css` properly fade in with the requested fluid durations and easing.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories.

- [x] T014 Review layout shift (CLS) by interacting with the app; adjust rigid set heights in `src/ui/styles/main.css` if necessary to keep CLS < 0.1.
- [x] T015 Verify visual fallback gracefully for devices lacking advanced CSS features (e.g., standard background-colors instead of transparency hooks).
- [x] T016 Run `npm run build` and `npm test` to verify no existing tests were broken by DOM class changes.

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: Defines CSS variables.
- **Foundational (Phase 2)**: Depends on Setup completion; applies globals.
- **User Stories (Phase 3+)**: Depend on Foundational phase completion. Story 1 (Calendar visual) should be done before Story 2 (Overlays/Events) to establish the base grid.

### Parallel Opportunities

- After foundational variables are set, modal transitions (`day-detail-modal.css`) and basic button styles (`form.css`) can be worked on in parallel.

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1 and 2 (Globals and CSS Vars).
2. Complete Phase 3 (Calendar Grid Redesign).
3. **Validate**: Check calendar aesthetics against the spec.
4. If acceptable, move to Phase 4 for interactive cards and modals.

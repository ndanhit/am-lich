---
description: "Task list for Lunar Event Manager UI Implementation"
---

# Tasks: Lunar Event Manager UI

**Input**: Design documents from `/specs/002-lunar-event-ui/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (SPA with frozen Core Engine)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization, entry point, and shared UI infrastructure

- [ ] T001 Create `index.html` entry point with semantic structure, viewport meta, and CSS/JS references
- [ ] T002 Create design token system and base styles in `src/ui/styles/index.css`
- [ ] T003 [P] Implement `StorageAdapter` interface and `LocalStorageAdapter` in `src/adapters/storage/local-storage-adapter.ts`
- [ ] T004 [P] Create UI-layer type definitions (`CalendarCell`, `CalendarViewModel`, `EventFormData`) in `src/ui/types.ts`
- [ ] T038 Configure esbuild bundler: `build:ui` and `dev` npm scripts in `package.json`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core application shell that MUST be complete before ANY user story UI can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T005 Create application shell and view router in `src/ui/views/app.ts` (manages active view state, renders header/nav)
- [ ] T006 Implement application state manager that loads events from `StorageAdapter` on init and exposes re-render hooks in `src/ui/state.ts`
- [ ] T007 Wire `index.html` to load `app.ts`, initialize `LocalStorageAdapter`, and bootstrap the application

**Checkpoint**: Foundation ready — app loads, reads from localStorage, shows an empty shell. User story views can now be added.

---

## Phase 3: User Story 1 — View Monthly Calendar (Priority: P1) 🎯 MVP

**Goal**: Render a navigable monthly calendar grid that displays lunar events on their correct solar date cells.

**Independent Test**: Open the app, create a sample event via browser console using the Core Engine API, refresh, and verify it appears on the correct solar date cell. Navigate months and confirm events shift correctly.

- [ ] T008 [US1] Build `CalendarViewModel` factory function that takes `year`, `month`, and `LunarEvent[]`, calls Core Engine API, and returns a grid of `CalendarCell[]` in `src/ui/components/calendar.ts`
- [ ] T009 [US1] Implement calendar grid renderer (CSS Grid, 7 columns, today highlight, event indicators) in `src/ui/components/calendar.ts`
- [ ] T010 [US1] Implement month navigation (prev/next buttons + month/year label) wired to re-render in `src/ui/components/calendar.ts`
- [ ] T011 [US1] Implement event detail panel shown on date cell click (event name, lunar date, leap rule, days until) in `src/ui/components/event-detail.ts`
- [ ] T012 [US1] Style calendar grid, cells, event indicators, today highlight, and detail panel in `src/ui/styles/index.css`
- [ ] T013 [US1] Integrate calendar component into application shell as the default view in `src/ui/views/app.ts`

**Checkpoint**: Calendar displays events on correct solar dates. Month navigation works. Clicking a date shows event details. Fully offline.

---

## Phase 4: User Story 2 — Create New Lunar Event (Priority: P1) 🎯 MVP

**Goal**: Provide a form for creating new recurring lunar events that persist locally.

**Independent Test**: Open the Add Event form, fill in valid fields, save, and verify the event appears on the calendar at the correct solar cell. Enter invalid data and verify the validation error.

- [ ] T014 [US2] Build event creation form component with fields: name, lunar day (1–30), lunar month (1–12), leap month rule dropdown in `src/ui/components/event-form.ts`
- [ ] T015 [US2] Wire form submission to Core Engine validation API → Core Engine CRUD API → `StorageAdapter.save()` → calendar re-render in `src/ui/components/event-form.ts`
- [ ] T016 [US2] Implement inline validation error display (delegated to Core Engine validation) in `src/ui/components/event-form.ts`
- [ ] T017 [US2] Add "Add Event" button/trigger to calendar view and wire modal/panel open in `src/ui/views/app.ts`
- [ ] T018 [US2] Style event form, validation errors, and modal/panel in `src/ui/styles/index.css`

**Checkpoint**: Users can create events via form. Events appear on calendar immediately. Validation errors shown for invalid input. Data persists across refresh.

---

## Phase 5: User Story 3 — View Upcoming Events List (Priority: P2)

**Goal**: Display a chronologically sorted list of upcoming lunar event occurrences.

**Independent Test**: Create multiple events, switch to the upcoming view, and verify events are listed in ascending date order with correct "days until" counts and year crossover.

- [ ] T019 [US3] Build upcoming events list component that calls Core Engine API with today's date and renders sorted occurrences in `src/ui/components/upcoming-list.ts`
- [ ] T020 [US3] Implement list item rendering with event name, solar date, lunar date, leap indicator, and days-until badge in `src/ui/components/upcoming-list.ts`
- [ ] T021 [US3] Add navigation tab/toggle for Calendar ↔ Upcoming views in `src/ui/views/app.ts`
- [ ] T022 [US3] Style upcoming list, list items, badges, and empty state in `src/ui/styles/index.css`

**Checkpoint**: Upcoming list shows correct future events. Switching between Calendar and Upcoming views works. Empty state is handled.

---

## Phase 6: User Story 4 — Edit and Delete Events (Priority: P2)

**Goal**: Allow users to modify or remove existing events with immediate UI feedback.

**Independent Test**: Edit an event's name and lunar date, save, and verify the calendar updates. Delete an event and verify it disappears from all views.

- [ ] T023 [US4] Extend event detail panel with "Edit" and "Delete" action buttons in `src/ui/components/event-detail.ts`
- [ ] T024 [US4] Implement edit flow: pre-populate form with existing event data, wire update to Core Engine CRUD API → storage → re-render in `src/ui/components/event-form.ts`
- [ ] T025 [US4] Implement delete flow: confirmation dialog → Core Engine CRUD API → storage → re-render in `src/ui/components/event-detail.ts`
- [ ] T026 [US4] Style edit/delete buttons, confirmation dialog, and transition states in `src/ui/styles/index.css`

**Checkpoint**: Full CRUD operational. Edit changes persist and calendar repositions events. Delete removes from all views.

---

## Phase 7: User Story 5 — Import and Export Events (Priority: P3)

**Goal**: Allow users to export events as a JSON file and import events from a file with deterministic conflict resolution.

**Independent Test**: Export events, clear localStorage, re-import the file, and verify all events are restored identically.

- [ ] T027 [US5] Implement export flow: load from storage → Core Engine export API → Blob → download link in `src/ui/components/import-export.ts`
- [ ] T028 [US5] Implement import flow: file input → FileReader → Core Engine validation API → Core Engine import API → storage → re-render in `src/ui/components/import-export.ts`
- [ ] T029 [US5] Implement import error handling and success feedback in `src/ui/components/import-export.ts`
- [ ] T030 [US5] Add Import/Export controls to application shell (settings area or toolbar) in `src/ui/views/app.ts`
- [ ] T031 [US5] Style import/export buttons, file input, status messages in `src/ui/styles/index.css`

**Checkpoint**: Export downloads a valid JSON file. Import restores events with conflict resolution. Invalid files show error.

---

## Phase 8: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T032 Implement responsive layout (mobile ≥ 320px, tablet, desktop) via media queries in `src/ui/styles/index.css`
- [ ] T033 [P] Add empty state UI for calendar (no events) and upcoming list (no upcoming) with clear CTAs in respective components
- [ ] T034 [P] Add loading/transition states for month navigation and form submission in `src/ui/styles/index.css`
- [ ] T035 Handle `StorageAdapter` write failures with user-visible error messages in `src/ui/state.ts`. **Acceptance criteria**: On localStorage `QuotaExceededError`, show toast "Failed to save — storage may be full" and do NOT dismiss unsaved form data.
- [ ] T036 Browser compatibility verification (Chrome 90+, Safari 15+, Firefox 90+)
- [ ] T037 Final visual polish: micro-animations, hover effects, dark mode support via `prefers-color-scheme` in `src/ui/styles/index.css`
- [ ] T039 Implement year boundary navigation: disable prev/next buttons at Core Engine min/max year range, show tooltip in `src/ui/components/calendar.ts`
- [ ] T040 Add debounce/cancellation for rapid month navigation to prevent stale renders in `src/ui/views/app.ts`
- [ ] T041 Handle large import (500+ events) with async batching or requestAnimationFrame to prevent UI freeze in `src/ui/state.ts`
- [ ] T042 Implement dark mode CSS ruleset applying design tokens via `@media (prefers-color-scheme: dark)` in `src/ui/styles/index.css`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion — BLOCKS all user stories
- **User Story 1 (Phase 3)**: Depends on Foundational — Calendar is the primary view
- **User Story 2 (Phase 4)**: Depends on Phase 3 (form adds events to calendar)
- **User Story 3 (Phase 5)**: Depends on Foundational only — can theoretically parallel Phase 3
- **User Story 4 (Phase 6)**: Depends on Phase 3 + 4 (needs calendar + form components)
- **User Story 5 (Phase 7)**: Depends on Foundational only — can parallel other stories
- **Polish (Phase 8)**: After all desired user stories complete

### Parallel Opportunities

- T003 and T004 (Setup) can run in parallel — different files
- T019–T022 (US3) can start as soon as Foundational completes (parallel to US1)
- T027–T031 (US5) can start as soon as Foundational completes (parallel to US1)
- T032, T033, T034 (Polish) can run in parallel — different concerns

---

## Implementation Strategy

### MVP First (User Stories 1 & 2)

1. Complete Setup + Foundational (CRITICAL)
2. Complete Phase 3: Calendar view with event display
3. Complete Phase 4: Event creation form
4. **STOP and VALIDATE**: Users can create and view lunar events on a calendar, fully offline
5. Incrementally add Upcoming List (US3), Edit/Delete (US4), Import/Export (US5)

### Incremental Delivery

1. Setup + Foundational → Empty app shell loads
2. Add US1 (Calendar) → Events displayed on correct solar dates
3. Add US2 (Create) → Full MVP — create + view events
4. Add US3 (Upcoming) → Forward-looking event list
5. Add US4 (Edit/Delete) → Full CRUD
6. Add US5 (Import/Export) → Data portability
7. Polish → Responsive, animations, dark mode

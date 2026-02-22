# Tasks: Enhance UI/UX & Fix Feedbacks (Feature 003)

## Implementation Strategy
- **Phase 1-2**: Foundation & Core Expansion. This blocks visual lunar date display.
- **Phase 3-7**: Priority P1 User Stories. Focused on localization, formatting, and core functionality.
- **Phase 8-10**: Priority P2-P3 User Stories. Focused on UX polish, grid refinement, and settings.
- **Final**: Polish & Cross-cutting concerns.

---

## Phase 1: Setup
Story Goal: Verify project state and ensure build pipeline is ready.
Independent Test Criteria: `npm run build:ui` succeeds without errors.

- [x] T001 Verify project structure and current build state with `npm run build:ui`
- [x] T002 Verify Vitest environment with `npm run test`

---

## Phase 2: Foundational (Core Engine Expansion)
Story Goal: Expose lunar conversion logic and Vietnamese Can Chi mapping to the UI layer.
Independent Test Criteria: Unit tests for `convertSolarToLunar` pass with correct Vietnamese names.

- [x] T003 [P] Implement Vietnamese Can Chi lookup table in `src/core/models/can-chi.ts` (NEW)
- [x] T004 [P] Update `src/core/models/types.ts` to include `LunarDateContext` and enhanced `CalendarCell` domain data
- [x] T005 Implement `convertSolarToLunar` in `src/core/lunar-math/converter.ts` using `lunar-javascript`
- [x] T006 Add unit tests for `convertSolarToLunar` in `tests/domain/converter.test.ts` (NEW)

---

## Phase 3: [US1] Vietnamese-Only Interface (P1)
Story Goal: Localize all user-visible strings to Vietnamese per FR-001.
Independent Test Criteria: Scan UI for any remaining English text.

- [x] T007 [P] [US1] Localize header and tab bar text in `src/ui/views/app.ts`
- [x] T008 [P] [US1] Localize event form labels and placeholders in `src/ui/components/event-form.ts`
- [x] T009 [P] [US1] Localize toast messages and confirm dialog strings in `src/ui/views/app.ts`
- [x] T010 [P] [US1] Localize labels and badges in `src/ui/components/upcoming-list.ts`

---

## Phase 4: [US2] Date Formatting Standards (P1)
Story Goal: Ensure solar dates use dd/MM/yyyy and lunar dates include Can Chi names per FR-002/FR-003.
Independent Test Criteria: Detail panel shows "22/02/2026" and "ngày 6 tháng 1 năm Bính Ngọ".

- [x] T011 [US2] Implement solar date formatter (`dd/MM/yyyy`) in `src/lib/formatters.ts`
- [x] T012 [US2] Implement traditional lunar date formatter in `src/lib/formatters.ts` including Can Chi year integration
- [x] T013 [US2] Update `src/ui/components/event-detail.ts` and `src/ui/components/upcoming-list.ts` to use new formatters

---

## Phase 5: [US3] Calendar Visibility & Loading (P1)
Story Goal: Ensure the monthly calendar is always visible (US3) and show loading states (FR-017).
Independent Test Criteria: Refresh app; verify loading indicator appears before calendar renders.

- [x] T014 [US3] Modify `renderCalendarView` in `src/ui/views/app.ts` to skip full-page empty state logic for calendar tab
- [x] T015 [US3] Add a subtle "Chưa có sự kiện" prompt below the calendar grid when events count is zero
- [x] T016 [FR-017] Implement CSS loading spinner/skeleton and integrate into `renderCalendarView` initialization

---

## Phase 6: [US5] Lunar Date Display in Cells (P1)
Story Goal: Passively display lunar day numbers in cells (US5) with DOM markers (FR-019).
Independent Test Criteria: Cells show lunar numbers; DOM inspection confirms `data-lunar-date` attribute.

- [x] T017 [US5] Update `buildCalendarViewModel` in `src/ui/components/calendar.ts` to fetch lunar data via `convertSolarToLunar`
- [x] T018 [US5] [FR-019] Update `renderCalendar` in `src/ui/components/calendar.ts` to display lunar day numbers and add `data-lunar-date`
- [x] T019 [US5] [FR-007] Apply `--color-accent` (#ff6b9d) logic for mùng 1 highlight in `src/ui/styles/index.css`

---

## Phase 7: [US6] Full 42-Cell Grid & Sunday Start (P2)
Story Goal: Render a complete 6-row grid starting on Sunday (FR-008).
Independent Test Criteria: Navigate to Feb 2026; verify 6 full rows (42 cells) starting on Sunday.

- [x] T020 [US8] [FR-018] Implement `pushState` logic in `src/ui/views/app.ts` whenever an overlay (form/detail) is opened
- [x] T021 [US8] [FR-018] Add `popstate` listener to `src/ui/views/app.ts` to close active overlays on back navigation
- [x] T022 [US8] Ensure hardware back button on Android/Chrome closes modal instead of exiting app0.25` (FR-009) and are clickable

---

## Phase 8: [US7] Enhanced Event Detail (P2)
Story Goal: List multiple events and support badge interaction (FR-020).
Independent Test Criteria: Clicking a "5+" badge opens the detail panel listing all 5 events.

- [ ] T023 [US7] Update `renderEventDetail` in `src/ui/components/event-detail.ts` to include enhanced date header
- [ ] T024 [US7] Refactor detail panel for scrollable event list in `src/ui/styles/index.css`
- [ ] T025 [FR-020] Wire up "count badge" clicks to trigger the event detail panel in `src/ui/components/calendar.ts`

---

## Phase 9: [US4 & US8] Interaction & History (P1/P3)
Story Goal: Consistent styles (US4) and History API support for physical back button (FR-018).
Independent Test Criteria: Opening overlay then pressing Browser Back button closes ONLY the overlay.

- [x] T023 [US4] [FR-015] Apply Desktop Settings Modal styles (max 500px, centered) in `src/ui/styles/index.css`
- [x] T024 [US4] Ensure visual consistency between ⚙ and + buttons in header (aligned size/spacing)
- [x] T025 [P] [US1] Final Vietnamese string audit across detail panels and settings
- [x] T026 [P] [US4] Unify header button styles (⚙ and +) in `src/ui/styles/index.css`
- [x] T027 [US8] [FR-014] Implement 300ms ease-in-out transitions for toasts and overlays in `src/ui/styles/index.css`
- [x] T028 [FR-018] Integrate Browser History API (`pushState`/`popstate`) for overlays in `src/ui/views/app.ts`

---

## Phase 10: [US9] Settings Overlay & Shortcuts (P3)
Story Goal: Settings bottom sheet (mobile-first) and "Hôm nay" shortcut.
Independent Test Criteria: On desktop, settings is a centered modal (500px). On mobile, it's a bottom sheet.

- [ ] T029 [US9] Implement `SettingsView` with mobile bottom-sheet and desktop modal sizing in `src/ui/styles/index.css`
- [ ] T030 [US9] Add "Hôm nay" button to header (icon-btn style) and implement navigation logic in `src/ui/views/app.ts`
- [ ] T031 [US9] Update `openImportExport` to use the new `SettingsView` overlay structure

---

## Phase 11: Final Polish
Story Goal: Final verification of Success Criteria.
Independent Test Criteria: SC-001 through SC-006 are met.

- [ ] T032 Final localization audit (FR-001 scan)
- [ ] T033 Verify animation performance on standard desktop (SC-005)
- [ ] T034 Final documentation update (walkthrough.md)

---

## Dependencies
- Phase 2 (Core) blocks Phase 6 (Lunar display).
- Phase 4 (Formatters) blocks Phase 8 (Detail panel).
- Phase 3 (Localization) can run in parallel with Phase 2.

## Parallel Execution Examples
- [US1] Localization (T007-T010).
- [US4] Style polish (T026).
- [US9] Styles (T029).

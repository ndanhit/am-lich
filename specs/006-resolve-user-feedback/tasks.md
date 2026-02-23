# Tasks: User Feedback Resolution

**Input**: Design documents from `/specs/006-resolve-user-feedback/`
**Prerequisites**: plan.md, spec.md, quickstart.md, data-model.md

**Organization**: Tasks are grouped by user story to enable independent implementation and testing.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (US1 - US6)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project state verification

- [x] T001 Verify `LocalStorageAdapter` save/load consistency in `src/adapters/storage/local-storage-adapter.ts`
- [x] T002 Verify `vitest` configuration and existing test patterns (if any)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure for grouping and safety

- [x] T003 Implement `showConfirm` logic in `app.ts` to support destructive actions in `src/ui/views/app.ts`
- [x] T004 Add CSS for `sticky` year headers and grouped lists in `src/ui/styles/index.css`
- [x] T005 Define `GroupedUpcomingEvents` interface and types in `src/core/models/types.ts`

---

## Phase 3: User Story 6 - Robust Event Import (Priority: P1)

**Goal**: Fix persistence bug and add safety warnings for imports.

**Independent Test**: Perform an import, verify the warning appears, check that modal closes, and F5 persists the data.

- [x] T006 [US6] Add confirmation warning before `state.importFromJson` in `src/ui/components/import-export.ts`
- [x] T007 [US6] Modify `AppState.importFromJson` to replace all events correctly and ensure `persist()` is called in `src/ui/state.ts`
- [x] T008 [US6] Update `renderImportExport` callback to close the settings modal on success in `src/ui/views/app.ts`

---

## Phase 4: User Story 1 - Group Upcoming Events (Priority: P1)

**Goal**: Group events by solar year in the "Sắp tới" list.

**Independent Test**: Open the Upcoming tab and verify year headers segment the events.

- [x] T009 Implement year grouping in `UpcomingListViewModel` in `src/ui/components/upcoming-list.ts`
- [x] T010 Update `renderUpcomingList` for grouped display (US2) in `src/ui/components/upcoming-list.ts`

---

## Phase 5: User Story 2 & 3 - Calendar Overhaul (Priority: P1)

**Goal**: Revert navigation to buttons/swipe and achieve <100ms transition performance.

**Independent Test**: Click prev/next and swipe left/right. Verify instantaneous month change.

- [x] T011 Ensure `sticky` headers are functional via CSS/DOM structure in `src/ui/styles/index.css`
- [x] T012 [US3] Implement pre-render logic for adjacent months in `src/ui/components/calendar.ts`
- [x] T013 [US2] [P] Add horizontal swipe (touch) and mouse drag gesture handlers to `src/ui/components/calendar.ts`
- [x] T014 [US3] Add 3-pane horizontal slider CSS for month transitions in `src/ui/styles/index.css`

---

## Phase 6: User Story 4 - Mobile UI Optimization (Priority: P2)

**Goal**: Fix solar vs lunar font size proportions on mobile.

**Independent Test**: Verify solar numbers are significantly larger than lunar numbers on mobile (<768px).

- [x] T015 [US4] Update `@media` queries for `.day-number` and `.lunar-day` in `src/ui/styles/index.css`

---

## Phase 7: User Story 5 - Traditional "Mùng" Prefix (Priority: P3)

**Goal**: Vietnamese cultural date formatting.

**Independent Test**: Days 1-10 should show "Mùng X" in Day Detail/Event Detail.

- [x] T016 [US5] Implement "Mùng" prefix logic for days 1-10 in `src/lib/formatters.ts`
- [x] T017 [US5] Capitalize the word "Tháng" in `formatLunarDate` in `src/lib/formatters.ts`

---

## Phase 8: Polish & Cross-Cutting

- [ ] T018 Run final end-to-end browser tests
- [ ] T019 Update `walkthrough.md` with new navigation and grouping screenshots
- [x] T020 [P] Clean up unused vertical scroll logic/types in `src/ui/views/app.ts`

---

## Dependencies & Execution Order

1. **Phase 2 (Foundational)** blocks all User Story phases.
2. **Phase 3 (Import Fix)** should be done first due to reported data loss risk.
3. **Phase 4 (Grouping)** and **Phase 5 (Calendar)** are high priority and can be done in any order once Foundation is ready.
4. **Phase 6 & 7** are UI/Polish and can be done last.

## Implementation Strategy

### MVP Increment (P1 stories)
1. Complete Setup + Foundation.
2. Fix Event Import (US6) to ensure reliability.
3. Group Upcoming Events (US1).
4. Implement Swipe/Navigation (US2/3).
5. Result: A reliable, high-performance calendar with better organization.

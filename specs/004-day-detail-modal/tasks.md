# Tasks - Day Detail Modal

## Status: COMPLETED

---

### Setup & Infrastructure
- [x] T001 [P] Create `src/ui/components/day-detail-modal.ts` and `src/ui/styles/day-detail-modal.css` <!-- id: 14 -->
- [x] T002 Create unit test file `tests/domain/fortune.test.ts` <!-- id: 15 -->

### Implementation for Foundation (Core Engine)
- [x] T003 [P] Update `LunarDateContext` in `src/core/models/types.ts` to include fortune fields (fate, hours, ages) <!-- id: 16 -->
- [x] T004 Implement fortune data extraction in `src/core/lunar-math/converter.ts` using `lunar-javascript` <!-- id: 17 -->
- [x] T005 [P] Implement `DayDetailState` type and initial `DayDetailInfo` calculation logic in `src/ui/components/day-detail-modal.ts` <!-- id: 18 -->

### Implementation for User Story 1 (Core Modal UI)
- [x] T006 [P] [US1] Implement basic modal structure and Section 1 (Solar/Lunar headers) in `src/ui/components/day-detail-modal.ts` <!-- id: 19 -->
- [x] T007 [P] [US1] Implement Section 2 UI mapping for `fateElement`, `auspiciousHours`, and `incompatibleAges` in `src/ui/components/day-detail-modal.ts` <!-- id: 20 -->
- [x] T008 [US1] Add basic styling for modal overlay and sections in `src/ui/styles/day-detail-modal.css` <!-- id: 21 -->
- [x] T009 [US1] Integrate `renderDayDetailModal` into `onCellClick` in `src/ui/views/app.ts` <!-- id: 22 -->

### Implementation for User Story 2 (Navigation)
- [x] T010 [P] [US2] Implement state-based navigation (Prev/Next) in `src/ui/components/day-detail-modal.ts` <!-- id: 23 -->
- [x] T011 [US2] Wire up `<button class="quick-view-btn">` to trigger a hidden `<input type="date">` for native jumping <!-- id: 24 -->

### Implementation for User Story 3 (Event Integration)
- [x] T012 [P] [US3] Filter events from `AppState` for the active solar date in the modal <!-- id: 25 -->
- [x] T013 [US3] Implement dynamic Section 3 event list rendering in `src/ui/components/day-detail-modal.ts` <!-- id: 26 -->
- [x] T014 [US3] Add "Add Event" shortcut button in modal footer <!-- id: 27 -->
- [x] T015 [US3] Wire "Add Event" to `openCreateForm` with pre-filled date context <!-- id: 28 -->

### Implementation for User Story 4 (Polish & A11y)
- [x] T016 [US4] Implement mobile-first "Bottom Sheet" CSS media queries in `src/ui/styles/day-detail-modal.css` <!-- id: 29 -->
- [x] T017 [US4] Add ARIA attributes (`aria-modal`, `role="dialog"`) and focus management <!-- id: 30 -->
- [x] T018 Final review and clean up <!-- id: 31 -->

### Phase 5: Refinement & Polish (Feedback-driven)

- [x] T019 [US4] Fix header overlap: Adjust `.close-btn` and `.nav-btn` layout in `day-detail-modal.css` <!-- id: 32 -->
- [x] T020 [US4] Restructure Date Info: Change 3-line layout in `day-detail-modal.ts` and styling <!-- id: 33 -->
- [x] T021 [US4] UI Cleanup: Remove "Thông tin ngày" title in Section 2 <!-- id: 34 -->
- [x] T022 [US4] Fix Z-index: Ensure event-form modal appears above DayDetailModal <!-- id: 35 -->
- [x] T023 [US4] Date Picker: Position hidden input to help showPicker() placement <!-- id: 36 -->

### Phase 6: Theme Integration (Dark Mode Fix)

- [x] T024 [US4] Normalize CSS variables: Map `day-detail-modal.css` variables to `index.css` tokens <!-- id: 37 -->
- [x] T025 [US4] Date Picker Theming: Add `color-scheme` to `hidden-date-picker` and root <!-- id: 38 -->

### Phase 7: Event Form UI Refinement

- [/] T026 [US4] Align Close Button: Update `index.css` to align the close button in `modal-header` to the right <!-- id: 39 -->

### Phase 8: SEO Metadata & Assets

- [x] T027 [US5] Copy and Organize Icons: Move provided icons to `assets/icons` and verify <!-- id: 40 -->
- [x] T028 [US5] Update `index.html`: Add SEO meta tags, OG tags, and favicon links <!-- id: 41 -->
- [x] T029 [US5] Fix `manifest.json`: Ensure icon paths are correct for the new structure <!-- id: 42 -->

### Phase 9: Deployment Fix (Vercel)

- [x] T030 [US6] Update `package.json`: Set `build` to run `build:ui` <!-- id: 43 -->
- [x] T031 [US6] Create `vercel.json`: Configure output directory to root <!-- id: 44 -->

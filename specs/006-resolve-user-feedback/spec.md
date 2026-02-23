# Feature Specification: User Feedback Resolution

**Feature Branch**: `006-resolve-user-feedback`  
**Created**: 2026-02-23  
**Status**: Draft  
**Input**: User description: "resolve some feedbacks from user"

## Clarifications

### Session 2026-02-23

- Q: Should horizontal swipe provide a discrete "page-flip" effect or continuous scroll? → A: Discrete Page-Flip (Option A).
- Q: Should upcoming year headers be sticky? → A: Sticky Headers (Option A).
- Q: How to optimize month transitions <100ms? → A: Pre-render adjacent months (background) (Option A).
- Q: What are the swipe thresholds and animation specs? → A: 50px threshold, 300ms ease-out transition.
- Q: Should keyboard navigation be supported? → A: Yes, ArrowLeft and ArrowRight keys.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Group Upcoming Events by Solar Year (Priority: P1)

As a user, I want the "Sắp tới" (Upcoming) list to group events by their solar year (e.g., 2026, 2027), so I can clearly see which events belong to which year.

**Why this priority**: Improves scannability of the long-term schedule.

**Independent Test**: Open "Sắp tới" tab. Verify events are separated by year headers (e.g., "Năm 2026").

**Acceptance Scenarios**:

1. **Given** multiple events in the upcoming list across different years, **When** viewed, **Then** events are grouped under sticky or standard headers for each year.

---

### User Story 2 - Calendar Navigation Reversion & Swipe (Priority: P1)

As a user, I want to use buttons and horizontal swipes to change months instead of vertical scrolling, as it feels more intuitive for a calendar grid.

**Why this priority**: Direct user request to revert and refine navigation after feedback on the vertical scroll experiment.

**Independent Test**: Navigate months using new "Prev/Next" buttons in the header. Drag/Swipe left/right on the calendar grid to change months. Verify vertical scroll is disabled for navigation.

**Acceptance Scenarios**:

1. **Given** the calendar header, **When** viewed, **Then** it contains "<" and ">" buttons for month navigation.
2. **Given** the calendar grid, **When** swiping horizontally (touch) or dragging (mouse), **Then** the month changes accordingly.
3. **Given** the calendar grid, **When** scrolling vertically, **Then** the month does NOT change.

---

### User Story 3 - Navigation Performance Optimization (Priority: P1)

As a user, when I change months, I want the transition to be instantaneous without a visible loading delay.

**Why this priority**: Users reported a "wait" period during month transitions which degrades the experience.

**Independent Test**: Repeatedly click "Next" button. Verify the grid updates immediately (<100ms) without flickering or long gaps.

**Acceptance Scenarios**:

1. **Given** a month change trigger, **When** activated, **Then** the view updates in under 100ms.

---

### User Story 4 - Mobile Font Size Correction (Priority: P2)

As a mobile user, I want the solar date font size to be clearly larger than the lunar date font size, matching the desktop proportions.

**Why this priority**: Corrects a scaling issue where mobile dates look unbalanced or hard to distinguish.

**Independent Test**: Open app on mobile. Compare solar date (large number) vs lunar date (small number). Verify solar is visibly larger.

**Acceptance Scenarios**:

1. **Given** a calendar cell on mobile, **When** viewed, **Then** the solar date font size is at least 1.5x the size of the lunar date font size.

---

### User Story 5 - Traditional "Mùng" Prefix (Priority: P3)

As a user, I want lunar days 1-10 to use the "Mùng" prefix in detailed views.

**Why this priority**: Vietnamese cultural standard.

**Acceptance Scenarios**:

1. **Given** lunar day 1-10, **When** viewed in `formatLunarDate`, **Then** prefix with "Mùng".

---

### User Story 6 - Robust & Destructive Event Import (Priority: P1)

As a user, I want to import events from a file reliably, knowing that it will replace my current list, and I want the settings modal to close automatically when it's done.

**Why this priority**: Corrects a functional bug where imports appear successful but don't persist, and improves UX by adding safety warnings for destructive actions.

**Independent Test**: Prepare an import file. Click "Nhập sự kiện". Verify a warning appears. Confirm. Verify settings modal closes and events are visible even after Page Refresh (F5).

**Acceptance Scenarios**:

1. **Given** the "Nhập sự kiện" button, **When** clicked, **Then** a warning dialog appears: "Hành động này sẽ xóa tất cả sự kiện hiện tại và thay thế bằng dữ liệu mới. Bạn có chắc chắn muốn tiếp tục?".
2. **Given** the user confirms the warning, **When** the import is successful, **Then** the Settings modal closes automatically and a success toast appears.
3. **Given** events are imported, **When** the page is refreshed (F5), **Then** the imported events are still present.

---

### Edge Cases

- **Swipe Sensitivity**: Ensure horizontal swipe doesn't trigger on minor accidental movements.
- **Pre-calculating months**: To optimize performance, the system should pre-render or cache adjacent months.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: "Sắp tới" list MUST implement **sticky** headers for each solar year (headers stay at bottom of header area during scrolling within that year).
- **FR-002**: Calendar MUST revert to Prev/Next buttons in the header.
    - **FR-002.1**: Buttons MUST have clear `:hover` and `:active` visual states (e.g., subtle background scale or opacity shift).
    - **FR-002.2**: Buttons MUST include `aria-label` (e.g., "Tháng trước", "Tháng sau").
- **FR-003**: Calendar MUST implement horizontal touch swipe and mouse drag gesture using a discrete **page-flip** effect (snapping one month at a time).
    - **FR-003.1**: Swipe threshold MUST be **50px** or 15% of container width to trigger navigation.
    - **FR-003.2**: Animation duration MUST be **300ms** with `ease-out` transition.
    - **FR-003.3**: Snapping MUST always land on a clean month boundary; no partial month views allowed.
- **FR-004**: Vertical scroll navigation MUST be removed.
- **FR-005**: System MUST **pre-render adjacent months** (1 month Previous and 1 month Next) in the background to ensure instantaneous (<100ms) transitions.
    - **FR-005.1**: If pre-rendering is incomplete, the system MUST show the current monthly loading spinner during transition.
- **FR-006**: Mobile CSS MUST ensure `.day-number` (solar) is larger than `.lunar-day` (currently they are too similar).
- **FR-007**: System MUST prefix lunar days 1-10 with "Mùng" and capitalize "Tháng" in `formatLunarDate`.
    - **FR-007.1**: The "Mùng" prefix MUST be applied to all lunar date displays (Calendar cells, Day Detail, Event Detail).
- **FR-008**: System MUST implement a confirmation warning before starting the event import process.
- **FR-009**: Event import MUST persist data to local storage correctly (fixing the "F5 loss" bug).
- **FR-010**: Settings modal MUST be closed automatically upon successful import.
- **FR-011**: Keyboard navigation MUST support **ArrowLeft** (Prev) and **ArrowRight** (Next) when the calendar view is active and no modals are open.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Upcoming events are visually segmented by year.
- **SC-002**: Month navigation (button click) takes <100ms.
- **SC-003**: On mobile screens (<768px), `.day-number` font-size is at least 18px while `.lunar-day` is around 12px.
- **SC-004**: 100% of imported events persist across browser refreshes.

# Feature Specification: Day Detail Modal

**Feature Branch**: `004-day-detail-modal`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "Show day detail modal when user click on a day from calendar"

## Clarifications

### Session 2026-02-22

- Q: Should the "Add Event" button inside the modal open the existing event creation flow? → A: Yes, open the existing event creation form (separate overlay).
- Q: Should "Xem nhanh ngày" use a native or custom date picker? → A: Use the browser's native `<input type="date">` picker.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Viewing Detailed Day Information (Priority: P1)

As a user, when I click on a specific day in the calendar, I want to see a modal overlay divided into three clear sections: Date Info, Fortune Info, and Events.

**Why this priority**: Correct information display is the primary goal of this modal. The three-section layout ensures a clear hierarchy of information.

**Independent Test**: Open the modal for a day and verify all three sections are present and correctly formatted.

**Acceptance Scenarios**:

1. **Given** the modal is open, **When** viewing **Section 1 (Date Info)**, **Then** it shows "Dương Lịch (dd Tháng MM năm yyyy)", "Âm lịch (d Tháng m năm [Can Chi Year])", "Ngày [Can Chi Day] - Tháng [Can Chi Month]".
2. **Given** Section 1, **When** clicking left/right arrows, **Then** the modal content updates to the previous/next day.
3. **Given** Section 1, **When** clicking "Xem nhanh ngày", **Then** a date picker appears allowing jumping to any solar date.
4. **Given** the modal is open, **When** viewing **Section 2 (Fortune Info)**, **Then** it shows "Mệnh ngày", "Giờ hoàng đạo" (list of hours), and "Tuổi xung" (list of incompatible ages).
5. **Given** the modal is open, **When** viewing **Section 3 (Events)**, **Then** it lists scheduled events or shows a "No events" hint with an "Add Event" (+) button.

---

### User Story 2 — Quick Navigation & Date Jump (Priority: P1)

As a user, I want to move between days or jump to a specific date without closing and reopening the modal.

**Why this priority**: Efficiency in browsing dates is key for users checking lunar dates or planning events.

**Independent Test**: Use navigation buttons and the "Quick view" feature to change dates within the modal.

**Acceptance Scenarios**:

1. **Given** the modal is open, **When** the left arrow is clicked, **Then** all sections update to display data for the previous day.
2. **Given** the modal is open, **When** the right arrow is clicked, **Then** all sections update to display data for the next day.
3. **Given** "Xem nhanh ngày" is clicked, **When** a new date is selected via the picker, **Then** the modal refreshes with that date's information.

---

### User Story 3 — Responsive Design (Priority: P2)

As a user, I want the three-section layout to be easy to read on both mobile and desktop.

**Why this priority**: Sections must be clearly separated to avoid information overload.

**Independent Test**: Resize the browser and verify the vertical stack of sections remains readable.

**Acceptance Scenarios**:

1. **Given** a mobile screen, **When** the modal is open, **Then** sections are stacked vertically and the modal is scrollable.
2. **Given** any screen, **When** viewing Section 2, **Then** lists (auspicious hours, ages) are formatted for readability (e.g., using badges or clear separators).

---

### Edge Cases

- **Date with many events**: Section 3 expands or becomes scrollable.
- **Leap month**: Lunar date in Section 1 must indicate if it's a leap month (Tháng X nhuận).
- **Navigation boundaries**: Navigation buttons should handle the engine's min/max supported years.
- **Empty State Section 2**: If no specific data exists (e.g., no auspicious hours), display clear fallback text (e.g., "Không có giờ hoàng đạo").

## State Management

The modal MUST maintain a central state to ensure consistent navigation and rendering:

- `activeSolarDate`: The date object currently being viewed.
- `dayDetailInfo`: The derived data for the `activeSolarDate` (lunar info, events, etc.).

All navigation actions (Arrows, Date Picker) MUST update the `activeSolarDate`, which then triggers a synchronous re-calculation of `dayDetailInfo`.

## Data Source & Flow

- **Synchronous Conversion**: All lunar and fortune data computations (from Core Engine) MUST be synchronous and performed in-memory.
- **No Async Dependencies**: Rendering the modal or navigating between days MUST NOT trigger external API calls or async operations for core date data to ensure performance (SC-002).
- **Event Retrieval**: Events are retrieved from the local data store synchronously for the `activeSolarDate`.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: Modal MUST be divided into three distinct vertical sections.
- **FR-002 (Section 1)**: MUST display solar date `dd Tháng MM năm yyyy`.
- **FR-003 (Section 1)**: MUST display lunar date `d Tháng m năm [Can Chi Year]`.
- **FR-004 (Section 1)**: MUST display `Ngày [Can Chi Day] - Tháng [Can Chi Month]`.
- **FR-005 (Section 1)**: MUST include Left/Right navigation buttons to change the `activeSolarDate`. Buttons MUST be disabled when reaching the engine's min/max supported date boundaries.
- **FR-006 (Section 1)**: MUST include a "Xem nhanh ngày" button that triggers a native browser date picker (via a hidden `<input type="date">` with appropriate `min`/`max` attributes).
- **FR-013**: Date picker selection MUST be restricted to the supported range (1901–2099).
- **FR-014**: Selecting a date via the date picker MUST NOT close the modal; it MUST update the `activeSolarDate`.
- **FR-007 (Section 2)**: MUST display "Mệnh ngày" (Day Element).
- **FR-008 (Section 2)**: MUST display "Giờ hoàng đạo" (Auspicious Hours). If empty, display "Không có giờ hoàng đạo".
- **FR-009 (Section 2)**: MUST display "Tuổi xung" (Incompatible Ages). If empty, display "Không có tuổi xung".
- **FR-010 (Section 3)**: MUST list events for the day.
- **FR-015**: Events MUST be sorted by `startTime` (ascending).
- **FR-016**: Each event MUST show its Title and Time (HH:mm).
- **FR-011 (Section 3)**: If no events, MUST show a hint and a "Thêm sự kiện" button. Clicking this button MUST open the existing app-wide event creation flow.
- **FR-012**: Modal MUST support closing via backdrop click, Close button, or ESC key.

### Accessibility Requirements

- **FR-017**: Modal MUST trap keyboard focus while open (Tab/Shift+Tab navigation restricted to modal elements).
- **FR-018**: When the modal is closed, focus MUST be restored to the calendar day cell that was originally clicked.

### Key Entities *(include if feature involves data)*

- **DayDetailInfo**:
    - `solarHeader`: "22 Tháng 02 năm 2026"
    - `lunarHeader`: "6 Tháng 1 năm Bính Ngọ"
    - `canChiLabel`: "Ngày Đinh Mão - Tháng Canh Dần"
    - `fateElement`: "Lô trung hỏa"
    - `auspiciousHours`: ["Tý (23h-1h)", "Sửu (1h-3h)", ...]
    - `incompatibleAges`: ["Giáp thân", "Nhâm thân", ...]
    - `events`: Array of user events

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of data points (Solar, Lunar, Can Chi, Fate, Hours, Ages) are visible in the modal.
- **SC-002**: Left/Right navigation updates the modal content in <150ms.
- **SC-003**: "Xem nhanh ngày" allows jumping to any date within the supported range (1901-2099).
- **SC-004**: Section 3 accurately reflects the current event count for the selected day.

## Assumptions

- The app already has a mechanism to identify which day cell is clicked and retrieve events for that day.
- The Core Engine already provides lunar conversion and Can Chi names (from Spec 003).
- The project's existing CSS variable system (`--color-surface`, `--transition-slow`, etc.) will be used for consistency.
- Standard modal libraries are NOT used; implementation will use custom Vanilla CSS/JS as per project guidelines.

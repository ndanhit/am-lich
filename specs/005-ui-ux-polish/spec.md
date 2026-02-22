# Feature Specification: UI/UX Refinement & Bug Fixes

**Feature Branch**: `005-ui-ux-polish`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "improve UI/UX and fix bugs. The details will be added later"

## Clarifications

### Session 2026-02-22

- Q: What specific bugs should be addressed in this feature? → A: Fixed mobile date picker in Day Detail Modal and increased mobile font sizes.
- Q: Where should the "Hôm nay" (Today) shortcut be placed? → A: Floating button at the bottom right, appearing only when the view is not on the current month.
- Q: Which UI components need the most polish? → A: Calendar navigation changed to vertical scroll (removing buttons) and grid updated to start on Monday.

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Continuous Scroll Navigation (Priority: P1)

As a user, I want to navigate between months by scrolling up and down instead of clicking buttons, so the interaction feels more modern and fluid.

**Why this priority**: Core navigation change that defines the user experience of the calendar.

**Independent Test**: Remove left/right arrows from the header. Scroll up/down on the calendar view and verify it transitions smoothly between months.

**Acceptance Scenarios**:

1. **Given** the calendar is open, **When** scrolling up, **Then** the view transitions to the previous month.
2. **Given** the calendar is open, **When** scrolling down, **Then** the view transitions to the next month.
3. **Given** the header, **When** viewed, **Then** it no longer contains the left/right navigation arrows.

---

### User Story 2 — Floating "Today" Button (Priority: P1)

As a user, when I scroll away from the current month, I want a floating button at the bottom right to jump back to "Today" quickly.

**Why this priority**: essential fallback for the new scroll-based navigation to ensure users don't get lost.

**Independent Test**: Scroll to a distant month, verify a floating button appears. Click it and verify the view returns to the current month.

**Acceptance Scenarios**:

1. **Given** the view is NOT on the current real-world month, **When** viewing the page, **Then** a floating "Hôm nay" button appears at the bottom right.
2. **Given** the floating button is visible, **When** clicked, **Then** the view jumps back to the current month and the button disappears.

---

### User Story 3 — Monday-Start Grid & Sunday Highlighting (Priority: P2)

As a Vietnamese user, I want the calendar week to start on Monday, and for Sundays to be highlighted in red (like lunar mùng 1) to match traditional calendar aesthetics.

**Why this priority**: Standardizes the calendar for the Vietnamese market and improves visual scannability of weekends.

**Independent Test**: Open the calendar, verify Monday is the first column. Verify Sunday titles and dates are highlighted in red.

**Acceptance Scenarios**:

1. **Given** the calendar grid, **When** viewed, **Then** the first column is "Thứ 2" (Monday).
2. **Given** the Sunday column, **When** viewed, **Then** both the header title ("CN") and all solar dates in that column are highlighted in `--color-accent` (red).

---

### User Story 4 — Mobile Readability & Bug Fixes (Priority: P2)

As a mobile user, I want larger fonts for better readability and a working date picker in the detail modal.

**Why this priority**: Directly impacts usability on small screens.

**Independent Test**: Open the app on mobile. Verify fonts are 20% larger. Open Day Detail Modal and verify the "Xem nhanh" picker works on touch.

**Acceptance Scenarios**:

1. **Given** a mobile device, **When** viewing the calendar, **Then** solar and lunar day fonts are 20% larger than the desktop baseline.
2. **Given** the Day Detail Modal on mobile, **When** touching the "Xem nhanh ngày" section, **Then** the native date picker opens as expected.

---

### Edge Cases

- **Fast Scrolling**: System must debounce or handle multiple scroll events to prevent jumping many months at once.
- **Scroll Overlap**: Ensure scrolling within the Day Detail Modal or Event List doesn't accidentally trigger a month change in the background.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST implement vertical scroll (up/down) as the primary month navigation.
- **FR-002**: Left/Right navigation buttons MUST be REMOVED from the header.
- **FR-003**: System MUST provide a Floating Action Button (FAB) at the bottom right labeled "Hôm nay".
- **FR-004**: The FAB MUST only be visible when the displayed month is different from the current system month.
- **FR-005**: The calendar grid MUST start the week on **Monday** (Thứ 2).
- **FR-006**: Sunday column headers and solar dates MUST be highlighted in red (using `--color-accent`).
- **FR-007**: Mobile font sizes for calendar numbers MUST be increased by 20% compared to current styles using media queries.
- **FR-008**: Day Detail Modal MUST ensure the native date picker trigger is correctly event-bound for mobile touch interactions.
- **FR-009**: [DELETE] Section 2 (Fortune Info) MUST be REMOVED from the Day Detail Modal to ensure only accurate data is displayed.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can transition between months using scroll in <200ms.
- **SC-002**: Sunday column follows the specified red highlighting consistently.
- **SC-003**: Mobile font sizes for dates (solar and lunar) are verified to be 20% larger than desktop.
- **SC-004**: Day Detail Modal only displays Section 1 (Date Info) and Section 3 (Events).

## Assumptions

- We will reuse the `day-detail-modal.css` bottom-sheet patterns for the Settings view.
- "Today" is defined by the user's local system time.
- Bug fixes will be added to this specification as the user provides more details.

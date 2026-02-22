# Feature Specification: Enhance UI/UX & Fix Feedbacks

**Feature Branch**: `003-enhance-ui-ux`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "enhance current UI/UX and fix some feedbacks"

## Clarifications

### Session 2026-02-22

- Q: How should the UI access solar→lunar conversion (needed for displaying lunar dates in calendar cells)? → A: Add `convertSolarToLunar()` to Core Engine public API (minimal expansion of frozen API surface)
- Q: How should lunar dates display in calendar cells (naming convention)? → A: Always show plain numbers (1–30). Use color-coding to visually distinguish the 1st day of each lunar month (no "Mùng" prefix)
- Q: How should Can Chi year names be mapped from Chinese characters to Vietnamese? → A: Static lookup table mapping Chinese Can Chi → Vietnamese names (60 entries, hardcoded)

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Vietnamese-Only Interface (Priority: P1)

The entire application interface must display in Vietnamese. All text including titles, labels, buttons, notifications, placeholders, and date strings must be localized to Vietnamese.

**Why this priority**: This is a lunar calendar app for Vietnamese users. English UI creates confusion and doesn't match the target audience.

**Independent Test**: Open the app and verify no English text remains in any UI element.

**Acceptance Scenarios**:

1. **Given** the app is open, **When** the user views the header and tabs, **Then** tabs display "Lịch" and "Sắp tới" instead of "Calendar" and "Upcoming"
2. **Given** the event form is open, **When** the user views labels, **Then** they read "Tên sự kiện", "Ngày âm lịch", "Tháng âm lịch", "Quy tắc tháng nhuận", "Tạo sự kiện"
3. **Given** an action succeeds, **When** a toast appears, **Then** it displays in Vietnamese (e.g., "Đã tạo sự kiện", "Đã xóa sự kiện")
4. **Given** the upcoming list is displayed, **When** dates are shown, **Then** month names use Vietnamese labels ("Tháng 1", "Tháng 2", ...) and badges read "Hôm nay", "X ngày nữa"

---

### User Story 2 — Vietnamese Date Formatting Standards (Priority: P1)

Solar dates must display in `dd/MM/yyyy` format. Lunar dates must follow traditional Vietnamese lunar calendar conventions, including the Can Chi (Heavenly Stems & Earthly Branches) year name (e.g., "ngày 6 tháng 1 năm Bính Ngọ").

**Why this priority**: This is a lunar calendar app — displaying dates in the correct Vietnamese standard is a core requirement.

**Independent Test**: Create an event, open its details, verify solar date is dd/MM/yyyy and lunar date includes Can Chi year name.

**Acceptance Scenarios**:

1. **Given** event details are shown, **When** the solar date is displayed, **Then** the format is `dd/MM/yyyy` (e.g., "22/02/2026")
2. **Given** event details are shown, **When** the lunar date is displayed, **Then** the format is "ngày X tháng Y năm [Can Chi Name]" (e.g., "ngày 6 tháng 1 năm Bính Ngọ")
3. **Given** the upcoming list, **When** dates are displayed, **Then** solar dates use dd/MM/yyyy format
4. **Given** the calendar month header, **When** the month/year is displayed, **Then** the format is Vietnamese (e.g., "Tháng 2, 2026")

---

### User Story 3 — Bug Fix: Calendar Always Visible (Priority: P1)

When no events exist, the monthly calendar is hidden and replaced with an empty state prompt asking users to add events. The calendar must always be visible regardless of whether events exist.

**Why this priority**: This is a bug — users open the app to see the calendar, not a blank page.

**Independent Test**: Clear all events (or use incognito browser), open the app, verify the monthly calendar is displayed.

**Acceptance Scenarios**:

1. **Given** no events exist, **When** the app opens, **Then** the monthly calendar displays fully with correct dates
2. **Given** no events exist, **When** the Calendar tab is active, **Then** the calendar renders normally, with an optional subtle prompt below (e.g., "Chưa có sự kiện. Bấm + để thêm") that does NOT replace the calendar
3. **Given** no events exist, **When** switching to the Upcoming tab, **Then** the empty state shows "Chưa có sự kiện sắp tới"

---

### User Story 4 — Consistent Header Button Styles (Priority: P1)

The header action buttons (settings ⚙ and add event +) must have consistent sizing, style, and spacing.

**Why this priority**: Inconsistent button styles create an unfinished impression, directly affecting first impressions.

**Independent Test**: Open the app, observe both header buttons, verify they have identical dimensions, border-radius, and even spacing.

**Acceptance Scenarios**:

1. **Given** the header is displayed, **When** viewing ⚙ and + buttons, **Then** both have the same width/height, border-radius, and equal spacing
2. **Given** the header is displayed, **When** hovering over either button, **Then** both use the same hover effect style (consistent background transition)
3. **Given** the ⚙ and + buttons, **When** comparing icon sizes, **Then** icons are proportionally equal and centered within their containers

---

### User Story 5 — Lunar Date Display in Calendar Cells (Priority: P1)

Each calendar cell must display the corresponding lunar date below the solar date. If the day is the first day of a lunar month (mùng 1), the lunar month name must also be shown so users can recognize the start of a new lunar month at a glance.

**Why this priority**: This is the core feature — users need to quickly see the corresponding lunar date without clicking individual cells.

**Independent Test**: Open the calendar, verify every cell shows a lunar date. Find a cell on the 1st lunar day and verify the month name is displayed.

**Acceptance Scenarios**:

1. **Given** the calendar is displayed, **When** viewing any day cell, **Then** the solar date is prominent (larger) and the lunar day number is shown below it (smaller, subdued) as a plain number (1–30)
2. **Given** a cell falls on the 1st day of a lunar month, **When** viewing that cell, **Then** the lunar day is color-coded distinctly (e.g., accent color) and the lunar month number is displayed alongside (e.g., "1" in accent color with "T.X" label)
3. **Given** a cell falls in a leap lunar month, **When** viewing that cell, **Then** a visual indicator distinguishes it (e.g., small "N" label or different color)
4. **Given** cells for adjacent months (leading/trailing), **When** viewing them, **Then** lunar dates are also displayed but in muted style matching the solar date

---

### User Story 6 — Calendar Shows Neighboring Month Days (Priority: P2)

The calendar grid must always display a full 6-row grid (42 cells), filling in leading days from the previous month and trailing days from the next month so the grid looks complete and consistent.

**Why this priority**: Currently the calendar only shows days of the current month, leaving blank rows at the start or end. This looks incomplete.

**Independent Test**: Navigate to any month and verify the grid always shows 42 cells with adjacent month days styled differently.

**Acceptance Scenarios**:

1. **Given** a month starts on Wednesday, **When** the calendar renders, **Then** Sunday–Tuesday of the first row show the last 3 days of the previous month in muted style
2. **Given** a month ends on Thursday, **When** the calendar renders, **Then** remaining cells are filled with next month's days in muted style
3. **Given** a neighboring-month day is clicked, **When** the user clicks it, **Then** the calendar navigates to that month

---

### User Story 7 — Enhanced Event Detail & Interaction (Priority: P2)

When tapping a day cell with events, the detail experience should be richer: showing lunar date context in proper format, listing all events on that date, with smooth transitions.

**Why this priority**: The current detail panel is functional but basic. Enhancing it improves daily usability.

**Independent Test**: Create multiple events on the same date, click the date, and verify all events are listed with smooth animations.

**Acceptance Scenarios**:

1. **Given** a date has multiple events, **When** clicking that date, **Then** the panel lists all events (not just the first)
2. **Given** the detail panel is open, **When** clicking outside or swiping down, **Then** the panel closes with a smooth animation
3. **Given** the detail panel opens, **When** it appears, **Then** it shows a date header (solar dd/MM/yyyy + lunar in traditional format), followed by a scrollable event list

---

### User Story 8 — Visual Polish & Micro-interactions (Priority: P3)

The app should feel premium with smooth animations, hover effects, and visual feedback across all interactions.

**Why this priority**: The current UI is functional but feels static. Small polish details significantly improve user perception and engagement.

**Independent Test**: Navigate through the app and verify all buttons, tabs, and navigation provide visible feedback animations.

**Acceptance Scenarios**:

1. **Given** hovering over a calendar cell, **When** cursor enters the cell, **Then** the cell smoothly highlights with a background change
2. **Given** clicking month navigation arrows, **When** the month changes, **Then** the calendar grid transitions with a subtle fade/slide (not an abrupt re-render)
3. **Given** switching tabs, **When** a tab is clicked, **Then** the view transitions with a crossfade effect
4. **Given** creating or deleting an event, **When** the action completes, **Then** a toast notification appears with a slide-in animation

---

### User Story 9 — Settings & "Today" Shortcut (Priority: P3)

The settings button should open a dedicated settings view (not just inline import/export). A "Hôm nay" (Today) button should allow jumping back to the current month instantly.

**Why this priority**: The gear icon currently opens import/export inline, which is confusing. A dedicated settings area improves feature discoverability.

**Independent Test**: Click ⚙, verify a settings view opens with organized sections.

**Acceptance Scenarios**:

1. **Given** clicking ⚙, **When** the settings view opens, **Then** it appears as a bottom sheet on mobile (full width) and a centered modal (500px max-width) on desktop, using the `--color-surface` and `--transition-slow` (300ms)
2. **Given** navigation to a different month, **When** clicking "Hôm nay", **Then** the calendar jumps to the current month with today highlighted. The "Hôm nay" button MUST follow the **header button style** (icon-btn) for consistency.
3. **Given** the settings overlay is open, **When** clicking outside, clicking close, or **pressing the browser back button**, **Then** the overlay dismisses and the previous state is restored (History API integration)
4. **Given** the toast notification appears, **When** it animates, **Then** it MUST use the same `ease-in-out` timing and `300ms` duration as the detail panel for visual harmony.

---

### Edge Cases

- Month requiring 6 rows (e.g., starts on Saturday)?  
  → Grid displays all 42 cells without overflow
- Lunar month has 29 vs 30 days?  
  → Display accurate lunar dates from Core Engine; never hardcode lunar month lengths
- 50+ events on the same lunar date?  
  → Detail panel is scrollable; calendar cell shows a count badge (e.g., "5+") instead of individual dots
- First/last supported year (1901/2099)?  
  → Navigation arrows disabled with tooltip
- Corrupted localStorage?  
  → Recovery toast and empty state (existing behavior)
- Can Chi year name cannot be determined?  
  → Fallback to solar year number instead of blank
- Timezone change mid-session (user changes system timezone while app is open)?  
  → Lunar dates are computed based on the solar date at render time; no live timezone tracking. User refreshes to pick up timezone changes.
- Mobile vs desktop interaction?  
  → Hover effects apply to pointer devices only (`@media (hover: hover)`); tap feedback applies on touch devices. Spec must not assume hover is universally available.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: All user-visible UI strings rendered in the application interface MUST be in Vietnamese (excludes console logs, dev-level debug text, browser-default validation messages, and non-rendered attributes)
- **FR-002**: Solar dates MUST display in `dd/MM/yyyy` format
- **FR-003**: Lunar dates MUST display in traditional Vietnamese format including Can Chi year name
- **FR-004**: Monthly calendar MUST always be visible regardless of event count (bug fix)
- **FR-005**: Header buttons (⚙ and +) MUST have consistent size and style
- **FR-006**: Each calendar cell MUST display the corresponding lunar date as a plain number (1–30)
- **FR-007**: Cells falling on the 1st day of a lunar month MUST be visually distinguished using `--color-accent` (#ff6b9d) for the lunar date and display the lunar month number (e.g., "1 T.1")
- **FR-017**: The application MUST display a loading indicator (CSS spinner or skeleton) when fetching or computing extensive calendar data to prevent "blank" states during high-CPU operations.
- **FR-018**: Overlays (Settings, Event Details) MUST push a temporary state to the Browser History API to allow the physical "Back" button on mobile devices to close the overlay instead of navigating away from the app.
- **FR-008**: Calendar grid MUST render a full 42-cell grid (6 rows × 7 columns), filling adjacent month days. **Week starts on Sunday.**
- **FR-009**: Adjacent-month cells MUST be visually muted (using `opacity: 0.25` or `--color-text-muted`) and clickable to navigate to that month
- **FR-019**: Each lunar date displayed in a calendar cell MUST have a specific class (e.g., `.lunar-day`) or data-attribute (e.g., `data-lunar-date`) to enable automated verification of lunar date presence.
- **FR-020**: Clicking a "count badge" (e.g., "5+") MUST trigger the same event detail panel as clicking the cell itself.
- **FR-010**: Event detail panel MUST list all events for the selected date
- **FR-011**: Month navigation MUST include a smooth transition animation
- **FR-012**: A "Hôm nay" (Today) button MUST allow returning to the current month
- **FR-013**: All interactive elements MUST have visible hover/focus feedback on pointer devices (`@media (hover: hover)`) and tap feedback on touch devices
- **FR-014**: Toast notifications MUST animate in and out smoothly
- **FR-015**: Core Engine MUST expose a `convertSolarToLunar()` function that returns lunar day, month, year, Can Chi year name, and leap month status for a given solar date
- **FR-016**: Can Chi mapping MUST be deterministic, locale-independent, and statically defined (no dynamic fetch). If a mapping entry is missing, fallback to the solar year number.

### Key Entities *(include if feature involves data)*

**CalendarCell (enhanced)** — domain data from Core Engine:
- `lunarDay` (number): Lunar day (1–30)
- `lunarMonth` (number): Lunar month (1–12)
- `lunarYear` (number): Lunar year
- `canChiYear` (string): Vietnamese Can Chi year name (e.g., "Bính Ngọ")
- `isLeapMonth` (boolean): Whether this date falls in a leap lunar month

**CalendarCell** — UI derived flags (computed from domain data, NOT from Core Engine):
- `isFirstDayOfLunarMonth` = `lunarDay === 1` (derived)
- `isToday` = comparison with current date (derived)
- `isCurrentMonth` = comparison with displayed month (derived)

**SettingsView**: Bottom sheet overlay accessible from the ⚙ button. 
- **Mobile**: Slides up from bottom, 100% width.
- **Desktop**: Centered modal, max-width 500px.
- **Interaction**: Dismisses on outside click, close button, or browser back. Contains import/export and "Hôm nay" shortcut.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of user-visible UI strings in the app interface are Vietnamese — no English text remains in rendered output
- **SC-002**: 100% of visible calendar cells display a lunar day number (measurable, testable by DOM inspection)
- **SC-003**: All solar dates conform to dd/MM/yyyy format throughout the app
- **SC-004**: Calendar grid appears complete and consistent regardless of which day the month starts on
- **SC-005**: Default transition duration target: 200–300ms on a standard desktop environment. Spec does not guarantee animation timing on low-end devices or under browser throttling.
- **SC-006**: Calendar is always visible when the app opens, even with zero events

## Assumptions

- The Core Engine will be minimally expanded to add `convertSolarToLunar()` — this is a read-only conversion function, not new domain logic
- The `lunar-javascript` library provides Can Chi year names via `getYearInGanZhi()` (returns Chinese characters); a static 60-entry lookup table maps these to Vietnamese names (e.g., "丙午" → "Bính Ngọ")
- The existing design system (CSS custom properties) is flexible enough for enhanced styles
- All other enhancements are UI-layer changes only — the frozen Core Engine API is otherwise sufficient

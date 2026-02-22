# Feature Specification: Lunar Event Manager UI

**Feature Branch**: `002-lunar-event-ui`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "Build an application layer and user interface for the Lunar Event Core Engine that allows end users to create, edit, delete, and view recurring lunar-based events. The UI must interact strictly through the public API of the frozen core engine without modifying its domain logic. The feature must provide calendar views, an upcoming events list, and event management forms while preserving deterministic behavior defined by the core. No business rules or lunar conversion logic may be reimplemented in the UI layer. The system must remain fully functional offline and persist user data locally through a storage adapter abstraction."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - View Monthly Calendar with Lunar Events (Priority: P1)

As a user, I want to see a monthly calendar that displays my recurring lunar events on their corresponding solar dates so that I can plan around culturally important dates at a glance.

**Why this priority**:  
A calendar view is the most intuitive visual entry point. Without rendering events on a calendar, users cannot see the core value of the engine — accurate lunar-to-solar date mapping — in action.

**Independent Test**:  
Can be fully tested by creating sample events via the Core Engine API, rendering the calendar for a given month, and verifying that events appear on the correct solar dates. Navigate between months to confirm events recur and shift correctly.

**Acceptance Scenarios**:

1. **Given** stored lunar events and a solar month in view,  
   **When** the user opens the calendar page,  
   **Then** events are displayed on the correct solar date cells, derived exclusively from the Core Engine's public API.

2. **Given** the calendar is displaying January 2027,  
   **When** the user navigates to February 2027,  
   **Then** the view updates with the correct events for that month without any network requests.

3. **Given** a lunar event falls on a date in the currently viewed month,  
   **When** the user taps/clicks the date cell,  
   **Then** a detail panel shows the event name, original lunar date (day/month), leap month rule, and days until occurrence.

---

### User Story 2 - Create a New Lunar Event (Priority: P1)

As a user, I want to create a new recurring lunar event by specifying a name, lunar day, lunar month, and leap month rule so that I can track important annual occasions.

**Why this priority**:  
Event creation is the other half of MVP functionality. Users must be able to populate the system with their culturally significant dates before viewing or managing them.

**Independent Test**:  
Can be tested by opening the event creation form, entering valid lunar date parameters, saving, and verifying the event appears in storage and on the calendar.

**Acceptance Scenarios**:

1. **Given** the user opens the "Add Event" form,  
   **When** they enter a valid event name, lunar day (1–30), lunar month (1–12), and select a leap month rule,  
   **Then** the event is saved locally via the Core Engine's public CRUD API and immediately appears on the calendar at the correct solar date.

2. **Given** the user enters an invalid lunar date (e.g., day 31, month 0),  
   **When** they attempt to save,  
   **Then** the form displays a clear validation error and does not save. Validation MUST be delegated to the Core Engine's public validation API.

3. **Given** the user creates an event with leap month rule `BOTH`,  
   **When** viewing a year that has the corresponding leap month,  
   **Then** the calendar displays two separate occurrences (regular and leap).

---

### User Story 3 - View Upcoming Events List (Priority: P2)

As a user, I want to see a chronologically sorted list of my upcoming lunar events so that I can prepare for important dates in advance.

**Why this priority**:  
After creating and viewing events on a calendar, users need a quick forward-looking summary. This provides immediate practical value beyond the calendar grid.

**Independent Test**:  
Can be tested by creating multiple events across different lunar months and verifying the upcoming list returns them in ascending solar date order from today.

**Acceptance Scenarios**:

1. **Given** multiple stored lunar events,  
   **When** the user opens the "Upcoming Events" view,  
   **Then** the system displays occurrences sorted by proximity (nearest first), with their solar dates and "days until" counts. Occurrence computation MUST be delegated to the Core Engine's public API.

2. **Given** an event whose next occurrence is in the next calendar year,  
   **When** the upcoming list is generated,  
   **Then** it correctly includes the cross-year occurrence.

3. **Given** the device is offline,  
   **When** the user views upcoming events,  
   **Then** all calculations and rendering succeed without network dependency.

---

### User Story 4 - Edit and Delete Lunar Events (Priority: P2)

As a user, I want to edit or delete existing lunar events so that I can keep my event list accurate and up to date.

**Why this priority**:  
Full CRUD capability completes the management experience. Without edit/delete, users are stuck with initial entries.

**Independent Test**:  
Can be tested by editing an event's name or lunar date and verifying the calendar reflects the change. Can also test deletion and confirm the event no longer appears.

**Acceptance Scenarios**:

1. **Given** an existing event displayed on the calendar or upcoming list,  
   **When** the user selects "Edit" and changes the event name,  
   **Then** the updated name persists locally and the calendar reflects the change immediately.

2. **Given** an existing event,  
   **When** the user selects "Delete" and confirms,  
   **Then** the event is removed from local storage and disappears from all views.

3. **Given** the user edits an event's lunar date from day 15 to day 1,  
   **When** saving,  
   **Then** the event moves to the correct new solar date position on the calendar.

---

### User Story 5 - Import and Export Events (Priority: P3)

As a user, I want to export my events to a file and import events from a file so that I can back up or transfer my data.

**Why this priority**:  
Data portability increases trust but is not required for day-to-day usage. Builds on top of the core import/export engine.

**Independent Test**:  
Can be tested by exporting stored events, clearing local data, re-importing the file, and verifying identical behavior.

**Acceptance Scenarios**:

1. **Given** existing stored events,  
   **When** the user taps "Export",  
   **Then** the system generates a JSON file download via the Core Engine's public export API.

2. **Given** a valid exported JSON file,  
   **When** the user uploads it via "Import",  
   **Then** events are merged into local storage via the Core Engine's public import API with deterministic conflict resolution.

3. **Given** an invalid or corrupted file,  
   **When** the user attempts to import,  
   **Then** the system shows a clear error message and does not modify existing data. Validation MUST be delegated to the Core Engine's public validation API.

---

## UI Design Constraints

- **Visual Design**: Implementation MUST use a modern design token system (CSS custom properties) defining: primary/secondary colors, typography scale, spacing scale, border-radius, and shadow levels. Specific color palette and typography are left to implementation discretion but MUST be consistent. Dark mode support via `prefers-color-scheme` media query.
- **Navigation Structure**: The app uses a single-page layout with a tab bar or toggle to switch between **Calendar** and **Upcoming** views. Event creation/editing appears as a modal or slide-in panel overlay. Import/Export controls are accessible from a settings/toolbar area.
- **Today Highlight**: The current solar date cell MUST be visually distinguished with a contrasting background or border (e.g., accent color ring). Today's cell MUST be distinguishable from event-containing cells.
- **Multiple Events Per Cell**: When multiple events resolve to the same solar date, the calendar cell shows a count badge (e.g., "3 events"). Clicking the cell lists all events in the detail panel.
- **Event Detail Panel**: Shows event name, original lunar date (month/day), leap month rule label (human-readable: "Regular only", "Leap only", "Both"), computed solar date, and days until next occurrence. Includes "Edit" and "Delete" action buttons.
- **Loading States**: Month navigation shows a brief skeleton or fade transition (≤ 200ms CSS transition). Form submission shows a disabled button with spinner during save.
- **Validation Error Display**: Inline error messages appear below the invalid field, styled in a warning/error color. Errors dismiss automatically upon valid input. Error text must describe the issue (e.g., "Day must be between 1 and 30").
- **Confirmation Dialogs**: Delete operations require a confirmation dialog with "Cancel" and "Delete" buttons. The dialog displays the event name being deleted.
- **Empty States**: Calendar with no events shows the grid with a centered "No events yet — tap + to create your first event" message. Upcoming list shows "No upcoming events" with a CTA button.
- **First-Run Experience**: On first app load with no stored data, the app opens directly to the calendar view with the empty state message. No onboarding wizard or tutorial.

---

## Edge Cases

- **Month Navigation Boundaries**: Navigating before the core engine's minimum year or beyond its maximum year disables the prev/next button and shows a tooltip "Earliest/latest supported year reached".
- **Rapid Navigation**: Quick month-switching must not cause stale or overlapping render states. Each render must be derived solely from the latest requested month. Implementation should debounce or cancel pending computations.
- **Storage Failure**: If localStorage write fails, the UI MUST show a toast/banner error: "Failed to save — storage may be full" and NOT dismiss the user's unsaved form data.
- **Large Import**: Importing a file with 500+ events must complete without UI freeze (use async batching if needed).
- **Concurrent Edits**: If the same event is modified and then imported with a newer timestamp, the import wins deterministically per Core Engine rules.
- **No-Event Months**: Months with no matching events display the calendar grid normally with no event indicators. No special message needed — the empty state message only appears when the entire dataset has zero events.
- **Year Transition**: Events in Lunar Month 12 that cross into the next Solar Year are displayed on the correct Solar date. Calendar navigation across December→January boundary works seamlessly.
- **Days Until Today**: An event occurring today displays "Today" instead of "0 days".
- **February Display**: The calendar grid correctly renders 28 or 29 days for February based on the solar year's leap status.
- **Event Name Length**: Maximum event name length is 100 characters. The form MUST enforce this limit and show a character counter.
- **Duplicate Event Names**: Duplicate names are permitted — events are uniquely identified by ID, not name.
- **Multi-Tab Behavior**: The app does NOT synchronize across multiple browser tabs. Each tab operates on its own loaded snapshot. This is a known limitation, not a defect.
- **Corrupted Storage**: If localStorage contains invalid JSON on load, the `StorageAdapter` returns an empty array (graceful degradation). A one-time warning toast is shown: "Could not load saved data — starting fresh."

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: UI MUST derive all solar date positions exclusively through the Core Engine's public API. The UI layer MUST NOT implement any lunar-to-solar conversion logic.
- **FR-002**: UI MUST delegate occurrence computation to the Core Engine's public API. The UI MAY apply additional view-layer sorting, filtering, or pagination on the computed results but MUST NOT reimplement domain calculation logic.
- **FR-003**: UI MUST delegate all event mutations (create, update, delete) to the Core Engine's public CRUD API. No direct mutation of the events array outside the engine.
- **FR-004**: UI MUST delegate lunar date validation to the Core Engine's public validation API. No independent date bounds checking in the UI layer.
- **FR-005**: UI MUST delegate import/export processing to the Core Engine's public sync API. No independent payload construction or conflict resolution in the UI layer.
- **FR-006**: UI MUST persist events through a storage adapter (localStorage or IndexedDB) that implements a defined interface. Core Engine never touches storage directly. Storage budget: ≤ 1MB for event data (well within 5MB localStorage limit).
- **FR-007**: UI MUST render a navigable monthly calendar grid showing solar dates with event indicators.
- **FR-008**: UI MUST provide a form for creating and editing events with fields: name (max 100 chars), lunar day (1–30), lunar month (1–12), and leap month rule (displayed as human-readable labels: "Regular month only", "Leap month only", "Both"). Edit mode pre-populates all fields with existing values; name and leap month rule are editable, lunar day and month are editable.
- **FR-009**: UI MUST display event details including original lunar date, leap month rule, and computed solar date.
- **FR-010**: UI MUST function fully offline. No network requests for any core functionality.
- **FR-011**: UI MUST provide visual feedback for loading states, validation errors, and empty states.
- **FR-012**: UI MUST be responsive and functional on mobile viewport sizes (≥ 320px width). At 320px, the calendar grid compresses cell padding and hides event names, showing only dot indicators. Detail panel and forms stack vertically.

### Non-Functional Requirements

- **NFR-001**: Accessibility — All interactive elements MUST be keyboard-navigable. Form inputs MUST have associated `<label>` elements. Buttons MUST have descriptive `aria-label` if icon-only. Color contrast MUST meet WCAG 2.1 AA (4.5:1 for normal text).
- **NFR-002**: Internationalization — Explicitly OUT OF SCOPE for this feature. Month names and UI labels are in English only. RTL layout is not supported.
- **NFR-003**: Browser Compatibility — Chrome 90+, Safari 15+, Firefox 90+. IE and legacy Edge are not supported.
- **NFR-004**: Core Engine Versioning — The UI is built against the current frozen Core Engine API. If the Core Engine API changes in a future version, the UI MUST be updated to match. No runtime version negotiation is implemented.

### Key Entities

- **StorageAdapter**: Interface abstracting read/write of `LunarEvent[]` to client-side storage. Core Engine remains unaware of storage implementation.
- **CalendarViewModel**: Computed view model combining a solar month grid with overlaid event occurrences, derived from Core Engine output.
- **EventFormData**: UI-layer data transfer object for the event creation/edit form, mapped to Core Engine `LunarEvent` type on save.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can create a lunar event and see it appear on the correct solar calendar date within 500ms of saving, for datasets ≤ 500 events. "Immediately" in acceptance scenarios is defined as ≤ 500ms.
- **SC-002**: Monthly calendar navigation (prev/next) renders the updated view in under 500ms for datasets ≤ 500 events.
- **SC-003**: Upcoming events list displays at least the next 10 occurrences accurately sorted by date proximity, computed in under 500ms for datasets ≤ 500 events.
- **SC-004**: All CRUD operations persist correctly after page refresh (verified via storage adapter).
- **SC-005**: The application functions identically with network disabled (verified by disabling network in browser DevTools).
- **SC-006**: Export produces a valid JSON file that can be re-imported with zero data loss.
- **SC-007**: UI renders correctly on viewports from 320px to 1920px width.

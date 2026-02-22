# Feature Specification: Lunar Event Management

**Feature Branch**: `001-lunar-core-engine`  
**Created**: 2026-02-22  
**Status**: Draft  
**Input**: User description: "Build an application that allows users to manage recurring events based on the lunar calendar. Events are defined by lunar day and month (including leap month awareness) and automatically recur every year. The system must correctly convert between solar and lunar dates, display events on the corresponding solar calendar days, and provide a view of upcoming events. The application must function fully offline, support deterministic import/export of event data, and ensure that lunar-based events never disappear due to leap month variations."

---

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Create and View Lunar Events (Priority: P1)

As a user who follows the lunar calendar, I want to create events based on lunar day and month so that important annual occasions (e.g., memorial days) are always correctly recognized each year.

**Why this priority**:  
Without the ability to create and view lunar-based recurring events, the system delivers no core value. This is the minimum viable functionality.

**Independent Test**:  
Can be fully tested by creating a lunar event and verifying that it appears on the correct solar dates across different years.

**Acceptance Scenarios**:

1. **Given** no existing events,  
   **When** the user creates an event with lunar day X and lunar month Y,  
   **Then** the system stores the event as a recurring lunar event.

2. **Given** an existing lunar event,  
   **When** the user views a solar calendar date that corresponds to the event’s lunar date,  
   **Then** the event is displayed on that solar date.

3. **Given** a new lunar year begins,  
   **When** the solar date corresponding to the event’s lunar date occurs,  
   **Then** the event appears again automatically without re-creation.

---

### User Story 2 - Leap Month Handling (Priority: P2)

As a user, I want events created in a leap lunar month to behave predictably in years with and without that leap month so that my events never disappear.

**Why this priority**:  
Leap month correctness ensures trust and cultural accuracy. Errors here undermine the system’s credibility.

**Independent Test**:  
Can be tested by creating an event in a leap month and verifying its behavior in years that both contain and do not contain that leap month.

**Acceptance Scenarios**:

1. **Given** an event created in a leap lunar month,  
   **When** the target year contains the same leap month,  
   **Then** the event matches only that leap month.

2. **Given** an event created in a leap lunar month,  
   **When** the target year does not contain that leap month,  
   **Then** the event falls back to the corresponding regular month and is still displayed.

3. **Given** any leap month variation,  
   **When** converting between solar and lunar dates,  
   **Then** the system produces deterministic and consistent results.

---

### User Story 3 - View Upcoming Lunar Events (Priority: P2)

As a user, I want to see a list of upcoming lunar events so that I can prepare for important dates in advance.

**Why this priority**:  
Beyond viewing events on a single date, users need forward visibility. This significantly increases practical value.

**Independent Test**:  
Can be tested by creating multiple events and verifying that the system returns a correctly ordered list of future occurrences.

**Acceptance Scenarios**:

1. **Given** multiple stored lunar events,  
   **When** the user requests upcoming events from a given solar date,  
   **Then** the system returns future occurrences sorted in ascending order.

2. **Given** an event whose next occurrence falls in the next lunar year,  
   **When** calculating upcoming events,  
   **Then** the system correctly rolls over the year boundary.

---

### User Story 4 - Offline Operation (Priority: P1)

As a user, I want the system to function without internet access so that I can access my lunar events anytime.

**Why this priority**:  
Reliability is critical. Lunar events are often culturally significant and must remain accessible at all times.

**Independent Test**:  
Can be tested by disabling network access and verifying that event creation, viewing, and upcoming calculations still function.

**Acceptance Scenarios**:

1. **Given** no network connectivity,  
   **When** the user views a calendar date,  
   **Then** the system displays matching lunar events correctly.

2. **Given** no network connectivity,  
   **When** the user creates a new lunar event,  
   **Then** the event is stored and retrievable locally.

---

### User Story 5 - Import and Export Events (Priority: P3)

As a user, I want to export and import my lunar events so that I can back up or transfer my data safely.

**Why this priority**:  
Data portability increases trust and long-term usability but is not required for basic functionality.

**Independent Test**:  
Can be tested by exporting stored events, re-importing them into a clean environment, and verifying identical behavior.

**Acceptance Scenarios**:

1. **Given** existing events,  
   **When** the user exports data,  
   **Then** the system produces a structured, complete representation of all events.

2. **Given** a valid export file,  
   **When** the user imports it,  
   **Then** all events are restored accurately.

3. **Given** duplicate events with different update timestamps,  
   **When** importing,  
   **Then** the system deterministically keeps the most recently updated version.

---

## Edge Cases

- **Invalid Dates**: Mathematical bounds must reject Day > 30, and Day 30 in a 29-day leap/regular month permutation. Rejected instantly at creation by pure functions.
- **Corrupted Payloads**: Functions consuming import JSON must perform runtime schema validation (Zod/Type Guards) and return a deterministic Error, never crashing the main thread.
- **Missing Leap Month**: `LEAP_ONLY` occurrences silently yield `[]` (0 hits) during years lacking that specific leap month.
- **Year Boundary Calculations**: The solar-to-lunar window logic must seamlessly calculate events occurring in Lunar Month 12 crossing into the next Solar Year without looping indefinitely.
- **Same-Day Collisions**: Multiple events resolving to the same solar date are stored sequentially and grouped by the presentation layer; the core returns flat arrays.

---

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to create recurring events defined by lunar day, lunar month, and leap month indicator.
- **FR-002**: System MUST convert solar dates to lunar dates accurately and deterministically using internal algorithms without external API/Network connectivity.
- **FR-003**: System MUST convert lunar dates to corresponding solar dates for any given year up to 2100.
- **FR-004**: System MUST calculate upcoming event occurrences bounded purely by mathematical limits, decoupled entirely from UI constructs (No DOM/Window usage in Core).
- **FR-005**: System MUST correctly handle leap month explicit rules (`REGULAR_ONLY`, `LEAP_ONLY`, `BOTH`) mathematically without dropping defined occurrence limits.
- **FR-006**: System MUST persist and function fully offline; storage adapters must be abstracted away from Core rules.
- **FR-007**: System MUST support exporting all stored events into a `ExportPayload` JSON structure containing an array of events and versioning.
- **FR-008**: System MUST deterministically import data by matching Unique IDs. Identical contents are skipped; differing content completely overwrites the local entry (No implicit field merges).
- **FR-009**: System MUST perform isolated rollback/aborts if an imported JSON file fails runtime schema validation mid-parse.

### Key Entities

- **LunarEvent**: Represents a recurring event defined by id, name, lunarDate (day, month), leapMonthRule, and timestamps.
- **LunarDate**: Represents a lunar calendar date including day and month.
- **UpcomingEventOccurrence**: Computed projection containing the original event, the matched SolarDate, and days until occurrence.

---

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: 100% of stored lunar events reappear correctly across at least 5 consecutive years during validation testing.
- **SC-002**: Leap month events never disappear during year transitions in test scenarios.
- **SC-003**: Users can retrieve upcoming events in under 1 second with a dataset of up to 500 events.
- **SC-004**: Exported data can be imported into a clean environment with zero data loss.
- **SC-005**: System functionality remains fully operational with network disabled.
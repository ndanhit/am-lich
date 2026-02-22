# Requirements: Lunar Event Manager

**Created**: 2026-02-22  
**Status**: Draft – Ready for Planning  
**Feature Reference**: spec.md  

---

# 1. Overview

Lunar Event Manager is an application that allows users to manage annually recurring events based on the lunar calendar.

The system must:

- Store events using lunar day and month
- Automatically convert lunar dates to their corresponding solar dates each year
- Display events on the solar calendar
- Correctly handle leap months
- Operate fully offline
- Support deterministic import/export of event data

---

# 2. Functional Requirements

## 2.1 Create Lunar Event

Users must be able to:

- Enter an event name
- Select a lunar date (day and month)
- Specify one of the following options:
  - Regular month
  - Leap month
  - Both

### Leap Month Rule

When creating an event, the system must require explicit leap month handling.

1. Regular month (default)  
   - The event occurs only in the regular month.  
   - If a leap month with the same number exists that year, the leap month is ignored.

2. Leap month  
   - The event occurs only in the leap month.  
   - If the corresponding leap month does not exist in a given year, the event does not occur that year.

3. Both  
   - The event occurs in both the regular and leap month (if the leap month exists).

The system must not infer behavior automatically.

---

## 2.2 Automatic Recurrence

- Events must recur annually.
- The system must accurately convert lunar dates to solar dates for each year.
- Events must not disappear due to leap month variations if a rule was explicitly defined at creation time.

---

## 2.3 Calendar Display

The system must:

- Display events on the solar calendar.
- Allow viewing:
  - Current month
  - Current year
  - Upcoming events (e.g., next 30 days)
- Clearly show:
  - Event name
  - Solar date
  - Corresponding lunar date

---

## 2.4 Offline Operation

- The application must function entirely without an internet connection.
- Lunar-to-solar conversion must rely on an internal algorithm and must not depend on external APIs.

---

## 2.5 Import / Export

### Export

- The system must export all event data to a file.
- The exported file must:
  - Have a deterministic structure
  - Be fully re-importable without data loss or modification
  - Preserve all event attributes

### Import

Each event must have a unique ID.

When importing:

1. If the ID does not exist  
   → Add the event.

2. If the ID already exists:
   - If the content is identical  
     → Skip.
   - If the content differs  
     → Overwrite with imported data.

The behavior must be deterministic.  
No user prompt.  
No implicit merging.

---

## 2.6 Edit & Delete

Users must be able to:

- Edit the event name
- Modify the lunar date or leap month rule
- Delete an event

All changes must apply to future recurrences.

---

# 3. Non-Functional Requirements

## 3.1 Deterministic Behavior

- The same input must always produce the same output.
- Importing the same file multiple times must not create unintended duplicates.

## 3.2 Data Integrity

- Events must not be lost when:
  - Changing years
  - Handling leap months
  - Performing import/export operations

## 3.3 Performance

- Lunar-to-solar conversion for a 100-year range must not introduce noticeable delay to the user.

---

# 4. Edge Cases

The system must correctly handle:

- Years with leap months
- Invalid dates (e.g., day 30 in a month that does not have 30 days) — must be rejected at creation
- Corrupted import files
- Import files missing required fields
- Leap-month-only events in years without the corresponding leap month

---

# 5. Success Criteria

The feature is considered successful when:

1. 100% of lunar-based events display on the correct solar dates across at least 50 years of validation.
2. No event is lost after 100 consecutive import/export cycles.
3. The system operates fully offline.
4. No undefined behavior exists in leap month handling or import conflict resolution.

---

# 6. Out of Scope

- Cloud synchronization
- Event sharing
- Push notifications
- Integration with third-party calendar systems
- Support for multiple lunar calendar systems (only one explicitly defined lunar system is supported)
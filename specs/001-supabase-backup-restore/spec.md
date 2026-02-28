# Feature Specification: Supabase Backup and Restore

**Feature Branch**: `001-supabase-backup-restore`  
**Created**: 2026-02-28  
**Status**: Draft  
**Input**: User description: "backup/restore all events with supabase postpre"

## Clarifications

### Session 2026-02-28
- Q: Data Model - Single Record Payload Size → A: Low Volume - Optimize for < 1,000 events (under 1MB).
- Q: Edge Cases - Partial Restore Handling → A: Strict Transaction - Sync all events perfectly before overwriting local storage; if saving fails, local storage remains untouched.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Manual Data Backup (Priority: P1)

Users can manually export and save all their calendar events to a secure cloud database (Supabase) to ensure their data is safely backed up and won't be lost if they lose their device.

**Why this priority**: Core required functionality to establish a backup.

**Independent Test**: Can be fully tested by creating local events, triggering the backup, and verifying the data appears in the Supabase database.

**Acceptance Scenarios**:

1. **Given** a user has local events and is authenticated, **When** they initiate a backup, **Then** all local events should be successfully saved to Supabase.
2. **Given** a device with no internet connection, **When** a user initiates a backup, **Then** they should receive a clear error message that connection is required.

### User Story 3 - Shared Authentication (Priority: P2)

Users who are already logged into the pension-admin application (pft.feedxiu.site) can seamlessly start using the calendar application (lich.feedxiu.site) without having to manually log in again, and vice versa.

**Why this priority**: Enhances user experience by reducing friction across the related app ecosystem.

**Independent Test**: Can be tested by logging into pft.feedxiu.site, navigating to lich.feedxiu.site, and verifying the user session is automatically recognized and active.

**Acceptance Scenarios**:

1. **Given** a user is logged into pft.feedxiu.site, **When** they visit lich.feedxiu.site, **Then** they should be automatically authenticated.
2. **Given** a new user logs into lich.feedxiu.site, **When** they visit pft.feedxiu.site, **Then** they should be automatically authenticated.

---

### User Story 2 - Manual Data Restore (Priority: P1)

Users can manually retrieve and import their previously backed up events from the Supabase cloud to their current device, allowing them to recover their schedule or migrate to a new device.

**Why this priority**: Essential companion to backup; without restore, the backup has no practical value to the end user.

**Independent Test**: Can be tested by having remote data in Supabase, triggering the restore on a fresh installation, and verifying the expected events appear locally.

**Acceptance Scenarios**:

1. **Given** a user has previously backed up events in Supabase, **When** they initiate a restore, **Then** the events should be downloaded and saved to the local device.
2. **Given** a user has no previous backups, **When** they initiate a restore, **Then** they should be informed that no backup data was found.

### Edge Cases

- What happens when a user restores data over existing local events? (The system will display a warning that data may be reset/overwritten).
- What happens if the Supabase database is temporarily unreachable during backup or restore?
- How are authentication sessions handled if third-party cookies or cross-site tracking are blocked by the user's browser, interfering with the shared credential mechanism between pft.feedxiu.site and lich.feedxiu.site?
- What happens if the app crashes or the local database encounters an error while writing the restored events? (The local storage remains perfectly intact as restoring follows an all-or-nothing transaction approach).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: System MUST allow users to manually initiate a backup of all local events to a Supabase Postgres database.
- **FR-002**: System MUST allow users to manually initiate a restore of all events from the Supabase Postgres database to the local device.
- **FR-003**: System MUST clearly warn users before a restore that existing local data will be reset/overwritten.
- **FR-004**: System MUST store all events for a single user as a single combined record/payload in the new database table.
- **FR-005**: System MUST use the existing Supabase project (currently used by `pension-admin-nextjs`) for authentication and database storage.
- **FR-006**: System MUST implement a shared credential/authentication mechanism between `pft.feedxiu.site` and `lich.feedxiu.site` so logging into one authenticates the other.
- **FR-007**: System MUST cleanly handle network interruptions by providing a user-friendly error message without corrupting local or remote data.
- **FR-008**: System MUST display a clear visual loading state/indicator during backup and restore operations to inform users that a potentially slow process is running.

### Key Entities

- **Events**: The calendar events containing title, date, time, description, and related metadata. (Optimized for payloads < 1,000 events in size).
- **User**: The entity representing the account owner in Supabase Auth to ensure data privacy and data scoping.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Users can successfully complete a full backup of 1000 events in under 10 seconds.
- **SC-002**: Users can successfully complete a full restore of 1000 events in under 10 seconds.
- **SC-003**: No data loss occurs during a successful backup or restore operation.
- **SC-004**: System successfully recovers from 100% of network interruptions during sync with proper error handling.

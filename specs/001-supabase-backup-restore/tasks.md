# Tasks: Supabase Backup and Restore

**Feature**: `001-supabase-backup-restore`
**Project**: `am-lich` (TypeScript, Vanilla DOM, esbuild)

## Implementation Strategy

We will build this feature incrementally. 
- **Phase 1 & 2** establish the connection, authentication layer, and service adapters.
- **Phase 3** delivers the core Backup capability (User Story 1), which is the safest operation (reads local, writes remote) and establishes the data structure.
- **Phase 4** delivers the Restore capability (User Story 2), handling the more complex strict-transaction local writes and warning UI.
- **Phase 5** ensures Shared Authentication (User Story 3) is working perfectly with the `feedxiu.site` cookie configuration.

## Dependencies

- Phase 2 (Foundation) blocks all User Stories.
- Phase 3 (US1 - Backup) should be completed before Phase 4 (US2 - Restore) to easily generate valid remote test data.
- Phase 5 (US3 - Shared Auth) can be parallelized with any of the UI/Adapter work once the Supabase client is initialized in Phase 2.

---

## Phase 1: Setup

Goal: Project infrastructure readiness

- [x] T001 Install `@supabase/supabase-js` as a production dependency in `package.json`
- [x] T002 Add `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` to Vite/esbuild environment variable loading in `build:ui` script or `.env` configuration.
- [ ] T003 Execute the quickstart SQL migration from `quickstart.md` on the remote Supabase database.

## Phase 2: Foundational

Goal: Establish the core remote service adapter and authentication client connection.

- [x] T004 Create `src/adapters/supabase/client.ts` implementing the initialized Supabase client using the cookie configuration outlined in `research.md`.
- [x] T005 Create `src/adapters/supabase/sync-adapter.ts` with empty method signatures for `backupEvents` and `restoreEvents`.
- [x] T006 Implement unit tests for the `sync-adapter.ts` in `tests/adapters/supabase/sync-adapter.test.ts` to mock Supabase calls.

## Phase 3: User Story 1 - Manual Data Backup (P1)

**Goal**: Users can manually export and save all their calendar events to the secure cloud database.
**Independent Test**: Connect to a test Supabase instance, create 3 local events, click 'Backup', and verify a single JSONB row appears in the `user_events_backup` table containing the 3 events.

- [x] T007 [US1] Implement the `backupEvents(events: Event[])` method in `src/adapters/supabase/sync-adapter.ts` to payload and UPSERT data.
- [x] T008 [US1] Update `src/ui/components/settings-modal.ts` (or equivalent settings UI) to include a "Backup to Cloud" button.
- [x] T009 [US1] Implement a loading state (spinner/disabled button) in the UI while the backup is in progress.
- [x] T010 [US1] Wire the Backup UI button to read from `local-storage-adapter` and push to `sync-adapter`.
- [x] T011 [US1] Display success or error toast/message in the UI upon backup completion or network failure.

## Phase 4: User Story 2 - Manual Data Restore (P1)

**Goal**: Users can retrieve and import their previously backed up events, replacing their local data safely.
**Independent Test**: Have events in the remote Supabase DB, clear local storage, click "Restore", and verify the UI updates with the remote events. Trigger a restore while offline and verify local data isn't wiped.

- [x] T012 [US2] Implement the `restoreEvents(): Promise<Event[] | null>` method in `src/adapters/supabase/sync-adapter.ts`.
- [x] T013 [US2] Create a confirmation dialog UI component warning the user that "Restoring will replace all existing local events. Continue?".
- [x] T014 [US2] Update `src/ui/components/settings-modal.ts` to include a "Restore from Cloud" button.
- [x] T015 [US2] Implement the strict-transaction restore logic: fetch remote -> memory -> overwrite `localStorage` -> trigger UI re-render.
- [x] T016 [US2] Implement the loading state for the restore button.
- [x] T017 [US2] Display success/error messages, specifically handling the "No backup found" and "Network unreachable" scenarios.

## Phase 5: User Story 3 - Shared Authentication (P2)

**Goal**: Seamless login recognizing active sessions from `pft.feedxiu.site`.
**Independent Test**: Log into the pension-admin app. Open the calendar app. Verify the settings/backup UI recognizes the user is signed in without asking for credentials again.

- [x] T018 [US3] Verify `src/adapters/supabase/client.ts` uses `.feedxiu.site` for the cookie domain.
- [x] T019 [P] [US3] Create an automatic session check on app initialization in `src/ui/views/app.ts` to detect existing cookies.
- [x] T020 [US3] Create a simple "Login / Logout" UI toggle in the settings modal if the user is *not* authenticated via the shared cookie.

## Phase 6: Polish & Cross-Cutting

Goal: Final code quality and edge case handling.

- [x] T021 Extract reusable UI elements (loading spinner, confirmation dialog) to their own files if they grew too complex in `src/ui/components/`.
- [x] T022 Double check error handling throughout the Supabase adapter to ensure network timeouts fallback gracefully.

---
description: "Task list for Lunar Event Manager Core Engine Implementation"
---

# Tasks: Lunar Event Manager

**Input**: Design documents from `/specs/001-lunar-event-manager/`
**Prerequisites**: plan.md (required), spec.md (required for user stories), research.md, data-model.md, contracts/

**Tests**: Test tasks are included to satisfy the strict deterministic and mathematical validation constraints of the **Lunar Core Engine Constitution**.
**Organization**: Tasks are grouped by user story to enable independent implementation and testing of each story.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files, no dependencies)
- **[Story]**: Which user story this task belongs to (e.g., US1, US2, US3)

## Path Conventions

- **Single project**: `src/`, `tests/` at repository root (Library Package approach verified in `plan.md`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project initialization and basic structure

- [ ] T001 Initialize pure TypeScript project and vitest environment
- [ ] T002 Configure tsconfig to output framework-agnostic ESM/CJS bundles
- [ ] T003 [P] Configure strict eslint and prettier rules targeting immutable patterns

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Core infrastructure that MUST be complete before ANY user story can be implemented

**⚠️ CRITICAL**: No user story work can begin until this phase is complete

- [ ] T004 Create core domain types (`LunarDate`, `SolarDate`, `LunarEvent`) in `src/core/models/types.ts`
- [ ] T005 Create `LeapMonthRule` enum and export schema payload types in `src/core/models/types.ts`
- [ ] T006 Implement core astronomical/lookup mathematical conversion purely in `src/core/lunar-math/converter.ts`
- [ ] T007 Write validation tests verifying lunar-to-solar basic math logic across known dates in `tests/domain/converter.test.ts`

**Checkpoint**: Foundation ready - basic domain conversions exist and are functionally pure.

---

## Phase 3: User Story 1 & 4 - Create & View Events / Offline (Priority: P1) 🎯 MVP

**Goal**: Establish deterministic local-only (offline) arrays of recurring events and project them onto accurate solar dates.

**Independent Test**: Arrays can be updated without network; basic events can be correctly associated with a static Solar Year conversion array.

### Tests for User Story 1
- [ ] T008 [P] [US1] Write test cases ensuring offline CRUD mechanisms properly handle immutability in `tests/application/crud.test.ts`
- [ ] T009 [P] [US1] Write contract tests forcing exactly 1 or 0 projected solar occurrences per regular lunar event in `tests/contract/occurrences.test.ts`

### Implementation for User Story 1
- [ ] T010 [US1] Implement CRUD array pure functions (Add, Update, Remove) in `src/application/events/crud.ts`
- [ ] T011 [US1] Implement `calculateOccurrencesForYear` mapping generic events through converter arrays in `src/lib/index.ts`
- [ ] T012 [US1] Verify no network APIs or side-effects accidentally leak during the build steps above.

**Checkpoint**: User Story 1 & 4 are fully functional and offline-certified. The library handles standard offline events safely.

---

## Phase 4: User Story 2 - Leap Month Handling (Priority: P2)

**Goal**: Prevent events from disappearing or duplicating by enforcing explicit leap month fallback behaviors.

**Independent Test**: An event created with `REGULAR_ONLY` ignores leap months, `LEAP_ONLY` vanishes in non-leap years, `BOTH` creates 2 events dynamically in leap years.

### Tests for User Story 2
- [ ] T013 [P] [US2] Write exact test suites for all 3 enum leap month rules using a known 2026/2028 leap scenario in `tests/domain/rules.test.ts`

### Implementation for User Story 2
- [ ] T014 [US2] Implement explicit leap month bounds filtering logic in `src/core/rules/leap-month.ts`
- [ ] T015 [US2] Integrate the bounds filtering into `calculateOccurrencesForYear` previously built in `src/lib/index.ts`
- [ ] T016 [US2] Enforce Validation rule ensuring invalid day combinations (day 30, month 29-day variant) throw errors gracefully.

**Checkpoint**: The domain engine fully understands and processes lunar anomalies deterministically.

---

## Phase 5: User Story 3 - View Upcoming Lunar Events (Priority: P2)

**Goal**: Aggregate and display chronological event projections based on calculated forward solar horizons.

**Independent Test**: Requesting events next month securely rolls boundaries over solar and lunar new year cycles natively.

### Tests for User Story 3
- [ ] T017 [P] [US3] Write chronological sorting tests testing 100+ simulated arrays spanning multiple years in `tests/application/upcoming.test.ts`

### Implementation for User Story 3
- [ ] T018 [US3] Implement chronological pipeline `getUpcomingEvents` taking reference static solar bounds in `src/application/queries/upcoming.ts`
- [ ] T019 [US3] Expose `getUpcomingEvents` contract explicitly in `src/lib/index.ts`

**Checkpoint**: Users can calculate and verify chronological proximity purely natively.

---

## Phase 6: User Story 5 - Import and Export (Priority: P3)

**Goal**: Safely generate deterministic offline payloads, and re-import them with a static overwriting resolver without user prompts. 

**Independent Test**: Output arrays parse identically, duplicate IDs perfectly resolve to the newest content state smoothly.

### Tests for User Story 5
- [ ] T020 [P] [US5] Write deterministic merge algorithm unit tests verifying specific Overwrite/Skip/Add states in `tests/application/sync.test.ts`
- [ ] T021 [P] [US5] Write schema payload tests against mock JSON fragments in `tests/application/export.test.ts`

### Implementation for User Story 5
- [ ] T022 [US5] Implement strict `importEvents` reducer logic matching ID equality constraints exactly in `src/application/sync/import.ts`
- [ ] T023 [US5] Implement `validateExportPayload` array bounds validator parsing data offline in `src/application/sync/export.ts`
- [ ] T024 [US5] Connect Export/Import functions explicitly in `src/lib/index.ts`

**Checkpoint**: Entire sync engine runs deterministically completely offline.

---

## Phase 7: Polish & Cross-Cutting Concerns

**Purpose**: Improvements that affect multiple user stories

- [ ] T025 [P] Run a performance benchmark ensuring logic scales < 100ms calculations under max bounds
- [ ] T026 Code cleanup, ensure complete code coverage (Aim for 100% on domain).
- [ ] T027 Final Constitution sanity check mapping purely to JSON bounds rules.

---

## Dependencies & Execution Order

### Phase Dependencies
- **Setup (Phase 1)**: No dependencies - can start immediately
- **Foundational (Phase 2)**: Depends on Setup completion - BLOCKS all user stories
- **User Stories (Phase 3+)**: All depend on Foundational phase completion
  - Phase 3, Phase 4, Phase 5, Phase 6 can theoretically proceed sequentially.
- **Polish**: Final layer once mathematical validation stops failing.

### Parallel Opportunities
- All tests for any given User Story can be run in parallel directly after Foundation completes.
- T013, T017, T020, T021 can be written practically side-by-side.

---

## Implementation Strategy

### MVP First (User Stories 1 & 4)
1. Complete Setup + Foundational (CRITICAL)
2. Complete Phase 3: Create, compute to Solar, rely strictly on offline logic.
3. Test MVP deterministically to prove Core Engine architecture hasn't violated system isolation.
4. Scale up complexity with Leap Months (US2), chronological sorts (US3), and Import/Export bounds checking (US5).

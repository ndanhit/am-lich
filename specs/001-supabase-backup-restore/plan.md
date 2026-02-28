# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement a manual backup and restore feature allowing users to export their local calendar events to a shared Supabase Postgres database. The feature leverages a shared authentication cookie format to enable single-sign-on (SSO) with the `pft.feedxiu.site` project. The remote data model uses a single unified JSONB payload per user, and restores follow a strict transaction logic to prevent data loss.

## Technical Context

<!--
  ACTION REQUIRED: Replace the content in this section with the technical details
  for the project. The structure here is presented in advisory capacity to guide
  the iteration process.
-->

**Language/Version**: TypeScript (ES2020 Target, Vanilla DOM)  
**Primary Dependencies**: `@supabase/supabase-js` (needs exact version matching `pension-admin-nextjs`), `esbuild`  
**Storage**: `localStorage` (Local), Supabase PostgreSQL (Remote)  
**Testing**: `vitest`  
**Target Platform**: Modern Web Browsers (`lich.feedxiu.site`)
**Project Type**: Vanilla TS Web App / PWA
**Performance Goals**: < 10 seconds for full backup/restore of up to 1000 events.  
**Constraints**: Offline-capable by default. Strict transaction rollback on restore failure.  
**Scale/Scope**: < 1000 events per user (~1MB payload max).

## Constitution Check

*GATE: Must pass before Phase 1 design.*

- [x] **Code Quality**: Structured to ensure side-effects (Supabase adapter) are strictly isolated from pure domain logic.
- [x] **Testing Standards**: Adapters will be unit tested using `vitest` matching the existing project standard.
- [x] **UX Consistency**: Incorporates standard loading states and warnings before destructive actions (restore).
- [x] **Performance**: Adopts a single JSONB bulk payload strategy to avoid n+1 network calls to Supabase.
- [x] **Simplicity**: No complex diffing or offline-first synchronization logic; purely manual trigger as requested.

## Project Structure

### Documentation (this feature)

```text
specs/[###-feature]/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
├── contracts/           # Phase 1 output (/speckit.plan command)
└── tasks.md             # Phase 2 output (/speckit.tasks command - NOT created by /speckit.plan)
```

### Source Code (repository root)
<!--
  ACTION REQUIRED: Replace the placeholder tree below with the concrete layout
  for this feature. Delete unused options and expand the chosen structure with
  real paths (e.g., apps/admin, packages/something). The delivered plan must
  not include Option labels.
-->

```text
# Option 1: Single project (DEFAULT)
src/
├── core/
├── adapters/
│   └── supabase/        # New adapter for remote sync
├── ui/
│   ├── components/      # New sync buttons / modals
│   └── styles/
└── lib/

tests/
└── adapters/
    └── supabase/        # New vitest specs
```

**Structure Decision**: Using existing Option 1 (Single Project) structure. Added an `adapters/supabase` directory for the remote store interactions to keep them cleanly separated from `core/` logic, adhering to the Constitution.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

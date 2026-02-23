# Implementation Plan: User Feedback Resolution

**Branch**: `006-resolve-user-feedback` | **Date**: 2026-02-23 | **Spec**: [spec.md](file:///Users/anh.nguyen/Workspace/personal/am-lich/specs/006-resolve-user-feedback/spec.md)
**Input**: Feature specification from `/specs/006-resolve-user-feedback/spec.md`

## Summary

This feature addresses critical user feedback to improve usability, cultural relevance, and reliability. Key changes include grouping upcoming events by year, reverting calendar navigation to a button-plus-horizontal-swipe model for better grid interaction, optimizing transition performance through pre-rendering (<100ms), and fixing a critical bug in event import persistence. Culturally, we are adding the "Mùng" prefix for lunar days 1-10.

## Technical Context

**Language/Version**: TypeScript / ES2022  
**Primary Dependencies**: `lunar-javascript` (Core logic), `esbuild` (Bundling), `serve` (Development)  
**Storage**: `localStorage` (LunarEvent persistence)  
**Testing**: `vitest` (Assumed for core logic, to be verified)  
**Target Platform**: Web (Mobile Responsive)  
**Project Type**: Web Application (Vanilla TS)  
**Performance Goals**: <100ms for month transitions via pre-rendering.  
**Constraints**: Zero-dependency for Core logic; Framework-agnostic UI components.  
**Scale/Scope**: ~100s of events per user, offline-first.

## Constitution Check

*GATE: Must pass before Phase 1 design.*

- [x] **Code Quality**: Functions in `calculateOccurrencesForYear` and `formatLunarDate` will remain pure.
- [x] **Testing Standards**: New logic for "Mùng" and Year Grouping will be covered by unit tests.
- [x] **UX Consistency**: Swipe navigation and headers will follow refined CSS tokens in `index.css`.
- [x] **Performance**: Pre-rendering adjacent months directly addresses transition lag feedback.
- [x] **Simplicity**: Avoiding complex state machines; using discrete event-driven animations for swipe.

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
# [REMOVE IF UNUSED] Option 1: Single project (DEFAULT)
src/
├── models/
├── services/
├── cli/
└── lib/

tests/
├── contract/
├── integration/
└── unit/

# [REMOVE IF UNUSED] Option 2: Web application (when "frontend" + "backend" detected)
backend/
├── src/
│   ├── models/
│   ├── services/
│   └── api/
└── tests/

frontend/
├── src/
│   ├── components/
│   ├── pages/
│   └── services/
└── tests/

# [REMOVE IF UNUSED] Option 3: Mobile + API (when "iOS/Android" detected)
api/
└── [same as backend above]

ios/ or android/
└── [platform-specific structure: feature modules, UI flows, platform tests]
```

**Structure Decision**: [Document the selected structure and reference the real
directories captured above]

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| [e.g., 4th project] | [current need] | [why 3 projects insufficient] |
| [e.g., Repository pattern] | [specific problem] | [why direct DB access insufficient] |

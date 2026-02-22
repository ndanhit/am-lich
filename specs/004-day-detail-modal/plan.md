# Implementation Plan: Day Detail Modal

**Branch**: `004-day-detail-modal` | **Date**: 2026-02-22 | **Spec**: [spec.md](file:///Users/anh.nguyen/Workspace/personal/am-lich/specs/004-day-detail-modal/spec.md)
**Input**: Feature specification from `specs/004-day-detail-modal/spec.md`

## Summary

Implement a comprehensive "Day Detail Modal" that provides a deep dive into solar/lunar dates, fortune information (Mệnh ngày, Giờ hoàng đạo, Tuổi xung), and daily events. The project uses a Vanilla TypeScript architecture with high performance requirements (<150ms updates). The implementation will follow the existing overlay patterns in the app (History API integration, CSS-based animations) while introducing a more robust state-driven rendering for navigating between dates within the modal.

## Technical Context

**Language/Version**: TypeScript 5.9+  
**Primary Dependencies**: `lunar-javascript` (Core logic), Vanilla CSS (Styling), esbuild (Bundler)  
**Storage**: LocalStorage (via `LocalStorageAdapter`)  
**Testing**: Vitest (`npm run test`)  
**Target Platform**: Modern Web Browsers (ES2020+)
**Project Type**: Single-Page Web Application (Vanilla TS)  
**Performance Goals**: <150ms interactive latency for date navigation within the modal  
**Constraints**: Synchronous data flow for lunar conversions; No async dependencies for core date display; Focus trap and accessibility requirements.  
**Scale/Scope**: Dedicated UI component for day details; Integration with existing `App` state and `LocalStorage`.

## Constitution Check

*GATE: Must pass before Phase 1 design.*

- [x] **Code Quality**: Does the design follow SOLID and clean code practices? (Componentization of modal logic)
- [x] **Testing Standards**: Does the plan include comprehensive test strategies (Unit, Integration)? (Vitest coverage for date navigation)
- [x] **UX Consistency**: Does the UI design align with the project design system? (Uses CSS variables and standard overlay patterns)
- [x] **Performance**: Are there clear performance goals and optimization strategies? (SC-002: <150ms updates)
- [x] **Simplicity**: Has over-engineering been avoided (YAGNI)? (Using native date picker and existing event flow)

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

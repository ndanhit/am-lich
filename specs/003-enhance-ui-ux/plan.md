# Implementation Plan: Enhance UI/UX & Fix Feedbacks

**Branch**: `003-enhance-ui-ux` | **Date**: 2026-02-22 | **Spec**: [spec.md](file:///Users/anh.nguyen/Workspace/personal/am-lich/specs/003-enhance-ui-ux/spec.md)

## Summary

Enhance the Lunar Event Manager application by localizing the UI to Vietnamese, improving calendar consistency (42-cell grid, Sunday start), and displaying lunar dates directly in calendar cells. The technical approach involves a minimal expansion of the frozen Core Engine API to expose conversion logic and implementing a refined UI layer with smooth animations and a bottom-sheet settings overlay.

## Technical Context

**Language/Version**: TypeScript 5.9+  
**Primary Dependencies**: `lunar-javascript` (domain conversion), `esbuild` (bundling), `vitest` (testing)  
**Storage**: `localStorage` (local source of truth)  
**Testing**: `vitest` (unit and integration tests)  
**Target Platform**: Modern Web Browsers (Mobile & Desktop)
**Project Type**: Web Application (Single Page)  
**Performance Goals**: UI transitions 200–300ms target on standard desktop environment  
**Constraints**: Offline-first by design, 100% Vietnamese user-visible strings  
**Scale/Scope**: Small dataset (user events), all data loaded into memory

## Constitution Check

*GATE: Must pass before Phase 1 design.*

- [x] **Code Quality**: Does the design follow SOLID and clean code practices? (Core remains pure)
- [x] **Testing Standards**: Does the plan include comprehensive test strategies? (Unit tests for conversion logic)
- [x] **UX Consistency**: Does the UI design align with the project design system? (Enhanced but consistent CSS)
- [x] **Performance**: Are there clear performance goals and optimization strategies? (Animation timing targets)
- [x] **Simplicity**: Has over-engineering been avoided (YAGNI)? (Focused on specific UI/UX gaps)

## Project Structure

### Documentation (this feature)

```text
specs/003-enhance-ui-ux/
├── plan.md              # This file
├── research.md          # Research findings (Phase 0)
├── data-model.md        # Enhanced CalendarCell model (Phase 1)
├── quickstart.md        # Interaction guide (Phase 1)
├── contracts/           # Core API expansion spec (Phase 1)
└── tasks.md             # Implementation tasks (Phase 2)
```

### Source Code

```text
src/
├── core/                # Functional Core (Domain logic)
│   ├── CoreEngine.ts    # [MODIFY] Add convertSolarToLunar
│   └── types.ts         # [MODIFY] Update LunarEvent/Calendar types
├── application/         # Services & Use Cases
├── adapters/            # Infrastructure (Storage, etc.)
├── ui/                  # UI Layer
│   ├── components/      # [MODIFY] CalendarCell, Header
│   ├── views/           # [MODIFY] HomeView, SettingsView (NEW)
│   └── styles/          # [MODIFY] Global polishing & animations
└── lib/                 # Shared utilities

tests/
├── domain/              # Core logic tests
└── application/         # Use case tests
```

**Structure Decision**: Single project structure following the Clean Architecture pattern (Core/App/Adapters/UI).

## Complexity Tracking

*No violations to justify.*

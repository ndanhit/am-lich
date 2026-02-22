# Implementation Plan: Lunar Event Manager

**Branch**: `001-lunar-event-manager` | **Date**: 2026-02-22 | **Spec**: [specs/001-lunar-event-manager/spec.md](spec.md)
**Input**: Feature specification from `/specs/001-lunar-event-manager/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a fully offline, deterministically tested Typescript Core Engine Library for managing lunar recurring events. The engine implements strict functional purity, separating leap month logic, calculations, and data mutation out of storage adapters and UI frames, as required by the Lunar Core Engine Constitution.

## Technical Context

**Language/Version**: TypeScript 5.x, Node.js environment (capable of running entirely pure in browser/mobile context)
**Primary Dependencies**: None for Core Engine logic. `date-fns` allowed only in adapters. Testing via `vitest` or `jest`.  
**Storage**: Client-side storage interfaces (LocalStorage / IndexedDB, abstracted). Core logic expects and returns JSON.
**Testing**: Comprehensive unit test suite focused on mathematical lunar conversion, offline data mutations, and exact logic edge cases across 50 years.
**Target Platform**: Framework-agnostic JSON-in/JSON-out library package. Wait for specific UI requirements later. 
**Project Type**: Core Engine Library (Deterministic Domain Functions)
**Performance Goals**: < 100ms conversions, < 200ms sorting operations for upcoming arrays.  
**Constraints**: MUST function offline. ZERO external API calls. Must strictly handle leap month states per specs.  
**Scale/Scope**: ~10,000 dates over 100 years. Small memory footprint.

## Constitution Check

*GATE: Must pass before Phase 1 design.*

- [x] **Code Quality**: Does the design follow SOLID and clean code practices?
  *Yes. Core routines are strictly functionally pure and decoupled from frameworks.*
- [x] **Testing Standards**: Does the plan include comprehensive test strategies (Unit, Integration)?
  *Yes. Math validations, deterministic test cases covering 50 years to ensure exact outcomes.*
- [x] **UX Consistency**: Does the UI design align with the project design system?
  *N/A - This phase focuses entirely on the Core Engine Library logic first.*
- [x] **Performance**: Are there clear performance goals and optimization strategies?
  *Yes. Under 100-200ms computational maximums defined for data transformation pipelines.*
- [x] **Simplicity**: Has over-engineering been avoided (YAGNI)?
  *Yes. We bypassed building an immediate full UI or database backend. Focus is strictly on the exact behavior.*

## Project Structure

### Documentation (this feature)

```text
specs/001-lunar-core-engine/
├── plan.md              
├── research.md         
├── data-model.md       
├── quickstart.md       
├── contracts/          
└── tasks.md            
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── lunar-math/        # Pre-calculated data and astronomically pure algorithms
│   ├── rules/             # Leap month explicit behavior functions
│   └── models/            # Type definitions, interfaces, Enums
├── application/
│   ├── events/            # CRUD operations over LunarEvent array data
│   ├── queries/           # Upcoming extraction mechanisms
│   └── sync/              # Import deterministic conflict resolvers
├── adapters/
│   ├── storage/           # Concrete storage implementations mapping array buffers to IDB/LS
│   └── external/          # Optional: time formatters
└── lib/                   # Entry point for the engine

tests/
├── domain/                # Leap rules / Math
└── application/           # Sync testing, Sorting pipelines
```

**Structure Decision**: Option 1 (Single project package). The architecture is completely centered around domain-driven design separation, keeping the Core Engine (pure math + types) completely insulated from application workflows and outside adapter (storage) logic. This guarantees the Constitution requirement: "Functional Core First."

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(No violations. Project is strictly modularized around functional purity without over-engineering data stores or external services).*

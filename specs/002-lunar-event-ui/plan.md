# Implementation Plan: Lunar Event Manager UI

**Branch**: `002-lunar-event-ui` | **Date**: 2026-02-22 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/002-lunar-event-ui/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Build a single-page web application using vanilla HTML/CSS/JS that provides calendar views, upcoming events lists, and CRUD forms for lunar-based recurring events. The UI communicates exclusively through the frozen Core Engine public API (`src/lib/index.ts`) and persists data via a localStorage adapter. No lunar conversion logic, domain rules, or business validation is reimplemented in the UI layer.

## Technical Context

**Language/Version**: TypeScript 5.x (Core Engine and UI layer), HTML5, CSS3  
**Primary Dependencies**: Core Engine library (local, frozen). No additional runtime dependencies for UI.  
**Storage**: localStorage via `StorageAdapter` interface (see `data-model.md`)  
**Testing**: Vitest (Core Engine tests preserved), Browser-based manual testing for UI  
**Target Platform**: Modern browsers (Chrome 90+, Safari 15+, Firefox 90+). Desktop and mobile viewports (≥ 320px).  
**Project Type**: Single-page web application (SPA) — no server, esbuild for TypeScript bundling (`npm run build:ui` → IIFE bundle)  
**Performance Goals**: All interactions under 500ms for datasets ≤ 500 events  
**Constraints**: MUST function fully offline. ZERO network requests. Core Engine is frozen — no modifications allowed.  
**Scale/Scope**: ≤ 500 events per user. Single-user local application. 3 primary views (Calendar, Upcoming, Form).

## Constitution Check

*GATE: Must pass before Phase 1 design.*

- [x] **Code Quality**: Does the design follow SOLID and clean code practices?
  *Yes. UI layer is strictly separated from Core Engine. StorageAdapter follows Interface Segregation. Views are composed from pure view models.*
- [x] **Testing Standards**: Does the plan include comprehensive test strategies (Unit, Integration)?
  *Yes. Core Engine tests remain untouched (30 passing). UI will be verified via browser-based testing with the browser tool.*
- [x] **UX Consistency**: Does the UI design align with the project design system?
  *Yes. CSS custom properties define a coherent design token system. Responsive layout via CSS Grid and media queries.*
- [x] **Performance**: Are there clear performance goals and optimization strategies?
  *Yes. Sub-500ms for all operations at ≤ 500 events. Core Engine already benchmarked at 25ms for 10k events.*
- [x] **Simplicity**: Has over-engineering been avoided (YAGNI)?
  *Yes. Vanilla HTML/CSS with TypeScript — no framework, no SSR. Lightweight esbuild bundler (30ms builds). localStorage over IndexedDB. All decisions documented in research.md.*

## Project Structure

### Documentation (this feature)

```text
specs/002-lunar-event-ui/
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
├── core/                  # Frozen Core Engine (DO NOT MODIFY)
│   ├── lunar-math/
│   ├── rules/
│   └── models/
├── application/           # Frozen application logic (DO NOT MODIFY)
│   ├── events/
│   ├── queries/
│   └── sync/
├── adapters/
│   └── storage/
│       └── local-storage-adapter.ts   # NEW: localStorage implementation
├── ui/
│   ├── components/
│   │   ├── calendar.ts                # NEW: Calendar grid renderer
│   │   ├── event-form.ts              # NEW: Create/Edit event form
│   │   ├── upcoming-list.ts           # NEW: Upcoming events list
│   │   ├── event-detail.ts            # NEW: Event detail panel
│   │   └── import-export.ts           # NEW: Import/Export controls
│   ├── views/
│   │   └── app.ts                     # NEW: Main application shell
│   └── styles/
│       └── index.css                  # NEW: Design system + component styles
├── lib/                   # Frozen library entry point
│   └── index.ts
└── types/

index.html                             # NEW: Application entry point
```

**Structure Decision**: Single project structure. The UI layer adds new files alongside the frozen Core Engine. No separate frontend project needed — the UI consumes Core Engine exports directly.

## Complexity Tracking

> **Fill ONLY if Constitution Check has violations that must be justified**

*(No violations. UI layer is cleanly separated, using only vanilla web technologies and the frozen Core Engine API.)*

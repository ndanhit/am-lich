# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Implement a major UI/UX overhaul focusing on fluid navigation and mobile accessibility. Key changes include switching month navigation to a continuous vertical scroll model, adding a floating "Hôm nay" button for quick return, standardizing on a Monday-start calendar grid with Sunday highlighting, and a 20% font increase for mobile readability. The internal "Fortune" data section will be removed from the day detail view due to data accuracy concerns.

## Technical Context

**Language/Version**: TypeScript 5.9+  
**Primary Dependencies**: `lunar-javascript`, Vanilla CSS3, esbuild  
**Storage**: LocalStorage (for persisted month state)  
**Testing**: Vitest (`npm run test`)  
**Target Platform**: Modern Web Browsers (Mobile-first)
**Project Type**: Single-Page Web Application (Vanilla TS)  
**Performance Goals**: <200ms month scroll transitions; 60fps scroll performance  
**Constraints**: No external UI/Scroll libraries; Offline-first; Sunday-specific highlighting.  
**Scale/Scope**: Core calendar view refactor; UI polish across mobile/desktop viewports.

## Constitution Check

*GATE: Must pass before Phase 1 design.*

- [x] **Code Quality**: Design uses clean state-matching and modular event listeners for scroll.
- [x] **Testing Standards**: Plan includes grid logic verification for Monday-start conversion.
- [x] **UX Consistency**: Uses `--color-accent` and `--bg-card` design tokens for all new elements.
- [x] **Performance**: Implements debouncing and passive scroll listeners for high performance.
- [x] **Simplicity**: Rejects heavy scroll libraries in favor of native `wheel` and `touchstart/move` handling.

## Project Structure

### Documentation (this feature)

```text
specs/005-ui-ux-polish/
├── plan.md              # This file (/speckit.plan command output)
├── research.md          # Phase 0 output (/speckit.plan command)
├── data-model.md        # Phase 1 output (/speckit.plan command)
├── quickstart.md        # Phase 1 output (/speckit.plan command)
└── checklists/
    └── requirements.md  # Spec quality checklist
```

### Source Code (repository root)

```text
src/
├── core/
│   ├── lunar-math/      # Conversion logic
│   └── models/          # Type definitions
├── ui/
│   ├── components/      # Calendar, Modals, Forms
│   ├── styles/          # index.css, day-detail-modal.css
│   └── views/           # app.ts main entry
└── lib/                 # formatters.ts, storage.ts

tests/
├── domain/              # Logic tests
└── integration/         # UI interaction tests
```

**Structure Decision**: Option 1 (Single Project) is used as this is a client-side only Vanilla TypeScript application.

## Complexity Tracking

| Violation | Why Needed | Simpler Alternative Rejected Because |
|-----------|------------|-------------------------------------|
| Manual Scroll Handling | Native `scroll-snap` conflicts with dynamic re-renders | `scroll-snap` causes visual artifacts when the underlying DOM structure changes during the scroll. |

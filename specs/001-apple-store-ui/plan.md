# Implementation Plan: [FEATURE]

**Branch**: `[###-feature-name]` | **Date**: [DATE] | **Spec**: [link]
**Input**: Feature specification from `/specs/[###-feature-name]/spec.md`

**Note**: This template is filled in by the `/speckit.plan` command. See `.specify/templates/plan-template.md` for the execution workflow.

## Summary

Redesign the lunar calendar web application using Apple Store design principles, focusing strictly on a pristine white light mode layout. The design features a new San Francisco-inspired typography scale, soft card-based content grouping, and fluid animation transitions.

## Technical Context

**Language/Version**: TypeScript / HTML / Vanilla CSS  
**Primary Dependencies**: `esbuild`, `lunar-javascript`  
**Storage**: LocalStorage (existing, unaffected)  
**Testing**: `vitest` (existing, unaffected)  
**Target Platform**: Web browsers (Mobile/Desktop)  
**Project Type**: Progressive Web Application  
**Performance Goals**: 60fps animations, layout shifts < 0.1 CLS  
**Constraints**: strictly offline-capable, responsive layout (mobile-first), pristine white mode only  
**Scale/Scope**: Entire application UI

## Constitution Check

*GATE: Must pass before Phase 1 design.*

- [x] **Code Quality**: Does the design follow SOLID and clean code practices? (Yes, pure CSS/TS separating view from logic).
- [x] **Testing Standards**: Does the plan include comprehensive test strategies (Unit, Integration)? (UI visual testing, existing tests unaffected).
- [x] **UX Consistency**: Does the UI design align with the project design system? (Yes, establishes a unified Apple-like system).
- [x] **Performance**: Are there clear performance goals and optimization strategies? (Hardware-accelerated CSS transforms/opacity).
- [x] **Simplicity**: Has over-engineering been avoided (YAGNI)? (Yes, strictly CSS/DOM updates without adding new frameworks).

## Project Structure

### Documentation (this feature)

```text
specs/001-apple-store-ui/
├── plan.md              # This file
├── research.md          # Design decisions based on Apple Store UX
├── data-model.md        # Mentions no changes to existing models
├── quickstart.md        # Instructions to run the dev server
```

### Source Code (repository root)

```text
src/
├── ui/
│   ├── styles/               # Will contain new design system tokens (CSS variables)
│   │   ├── main.css          # Global typography and background updates
│   │   ├── calendar.css      # Card layouts and interactions for the grid
│   │   ├── day-detail-modal.css # Modal animations
│   │   ├── event-list.css    # Typography and padding for upcoming lists
│   │   └── form.css          # Input field and button typography updates
│   ├── components/           # Vanilla DOM renderers to be updated for card classes
│   └── views/
│       └── app.ts            # High-level DOM wrapper structures
```

**Structure Decision**: Option 1 (Single project), maintaining the existing `src/ui/` structure and specifically updating the stylesheet references and DOM element classes to apply the new Apple Store aesthetic.

## Complexity Tracking

*(No Constitution violations detected. Proceeding with vanilla HTML/CSS implementation as specified by core principles.)*

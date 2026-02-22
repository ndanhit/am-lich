# Research: Lunar Event Manager UI

**Feature**: 002-lunar-event-ui  
**Date**: 2026-02-22  

## UI Framework Decision

**Decision**: Vanilla HTML/CSS/JS (no framework)  
**Rationale**: The constitution mandates simplicity over speculative scalability (Principle V). The Core Engine is a plain TypeScript library with no framework dependency. Since the spec requires offline-first behavior and the dataset is small (≤ 500 events in memory), a framework like React or Vue adds build complexity and dependency weight with negligible benefit. A single-page HTML + vanilla JS app keeps the architecture transparent and the bundle minimal.  
**Alternatives considered**:  
- React/Next.js — Rejected: introduces SSR complexity, React runtime overhead, and framework coupling. Unnecessary for this data scale.  
- Vite + Lit — Considered: lightweight, but still adds tooling. Deferred to future iteration if component reuse becomes a need.  

## Storage Adapter Decision

**Decision**: localStorage with JSON serialization  
**Rationale**: The dataset fits comfortably in localStorage (≤ 500 events × ~200 bytes ≈ 100KB, well under the 5MB localStorage limit). IndexedDB adds async complexity with no measurable benefit at this scale. The adapter interface is defined so it can be swapped later without any UI changes.  
**Alternatives considered**:  
- IndexedDB — Viable for larger datasets but adds callback/promise complexity. Not justified under Principle V (Simplicity).  
- In-memory only — Rejected: data must persist across page refreshes (SC-004).  

## Calendar Rendering Decision

**Decision**: Pure CSS Grid calendar, dynamically generated via DOM manipulation  
**Rationale**: A month grid is a 7-column repeating layout — CSS Grid handles this natively. No need for a calendar library. Event indicators overlay grid cells as data attributes or child elements. Navigation updates the grid by re-rendering from Core Engine output.  
**Alternatives considered**:  
- FullCalendar.js — Rejected: heavy library (100KB+), framework-oriented, and masks Core Engine integration.  
- `<table>` based layout — Functional but less semantic and harder to style responsively.  

## Styling Decision

**Decision**: Vanilla CSS with CSS custom properties (design tokens)  
**Rationale**: Aligns with web application development guidelines. Dark mode support via `prefers-color-scheme` media query. Responsive via media queries and fluid sizing. No build step needed.  
**Alternatives considered**:  
- TailwindCSS — Not requested by user.  
- CSS Modules — Require bundler setup, adding unnecessary complexity.  

## File Download/Upload for Export/Import

**Decision**: Blob + `<a download>` for export; `<input type="file">` with FileReader for import  
**Rationale**: Native browser APIs, zero dependencies, works fully offline. No server roundtrip.  
**Alternatives considered**:  
- FileSaver.js — Unnecessary wrapper around the same browser API.  

## Offline Verification

**Decision**: Service Worker for asset caching (optional enhancement). Core functionality already offline by design (no network calls).  
**Rationale**: The Core Engine and UI make zero network requests. A Service Worker would only cache the HTML/CSS/JS assets themselves for PWA-like behavior. This is optional and not required for spec compliance.  

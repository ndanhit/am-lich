# am-lich Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-02-22

## Active Technologies
- TypeScript 5.9+ + `lunar-javascript` (domain conversion), `esbuild` (bundling), `vitest` (testing) (003-enhance-ui-ux)
- `localStorage` (local source of truth) (003-enhance-ui-ux)
- TypeScript 5.9+ + `lunar-javascript` (Core logic), Vanilla CSS (Styling), esbuild (Bundler) (004-day-detail-modal)
- LocalStorage (via `LocalStorageAdapter`) (004-day-detail-modal)
- TypeScript 5.9+ + `lunar-javascript`, Vanilla CSS3, esbuild (005-ui-ux-polish)
- LocalStorage (for persisted month state) (005-ui-ux-polish)
- TypeScript / ES2022 + `lunar-javascript` (Core logic), `esbuild` (Bundling), `serve` (Development) (006-resolve-user-feedback)
- `localStorage` (LunarEvent persistence) (006-resolve-user-feedback)

- TypeScript 5.x (Core Engine — frozen)
- Vanilla JavaScript, HTML5, CSS3 (UI layer)
- Vitest (testing)
- localStorage (persistence via StorageAdapter)

## Active Features

- (001-lunar-event-manager) Core Engine Library — **COMPLETE, FROZEN**
- (002-lunar-event-ui) UI Application Layer — **IN PROGRESS**

## Project Structure

```text
src/
├── core/              # FROZEN — do not modify
├── application/       # FROZEN — do not modify
├── adapters/storage/  # NEW (002) — localStorage adapter
├── ui/                # NEW (002) — UI components and views
│   ├── components/
│   ├── views/
│   └── styles/
├── lib/               # FROZEN — public API entry point
└── types/
tests/
index.html             # NEW (002) — SPA entry point
```

## Commands

```bash
npm run build          # Compile TypeScript Core Engine
npm test               # Run all Vitest suites
npm run test:watch     # Vitest in watch mode
npm run lint           # ESLint
npm run format         # Prettier
```

## Code Style

- TypeScript: Follow strict mode conventions
- CSS: Vanilla CSS with custom properties (design tokens)
- No frameworks (React, Vue, etc.) unless explicitly requested
- Core Engine is frozen — UI interacts only via `src/lib/index.ts`

## Architectural Constraints

- UI MUST NOT import from `src/core/` or `src/application/` directly
- All domain logic accessed through `src/lib/index.ts` public API
- No lunar conversion logic reimplemented in UI layer
- Storage abstracted via `StorageAdapter` interface
- Zero network requests — fully offline

## Recent Changes
- 006-resolve-user-feedback: Added TypeScript / ES2022 + `lunar-javascript` (Core logic), `esbuild` (Bundling), `serve` (Development)
- 005-ui-ux-polish: Added TypeScript 5.9+ + `lunar-javascript`, Vanilla CSS3, esbuild
- 004-day-detail-modal: Added TypeScript 5.9+ + `lunar-javascript` (Core logic), Vanilla CSS (Styling), esbuild (Bundler)


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->

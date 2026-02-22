# Quickstart: Lunar Event Manager UI

**Feature**: 002-lunar-event-ui  

## Prerequisites

- Node.js 18+ (for build tools and dev server)
- Core Engine already built (`npm run build` in repo root)

## Setup

```bash
# From repository root
npm install

# Build Core Engine (if not already done)
npm run build

# Run tests
npm test
```

## Development

The UI is a single-page application built with vanilla HTML/CSS/JS. No framework build step required during UI development.

```bash
# Open index.html directly in browser
open index.html

# Or use a simple dev server (if added)
npx serve .
```

## Project Structure

```text
src/
├── core/           # Frozen Core Engine (DO NOT MODIFY)
├── adapters/
│   └── storage/    # localStorage adapter implementation
├── ui/
│   ├── components/ # Calendar, EventForm, UpcomingList, etc.
│   ├── views/      # Page-level compositions
│   └── styles/     # CSS files
└── lib/            # Core Engine entry point (frozen)

index.html          # Application entry point
```

## Key Commands

| Command | Description |
|---------|-------------|
| `npm run build` | Compile TypeScript Core Engine |
| `npm test` | Run all Vitest test suites |
| `npm run test:watch` | Run tests in watch mode |

## Architecture Constraint

> **The UI layer MUST NOT import from `src/core/` directly.**  
> All interactions flow through `src/lib/index.ts` (the public API).  
> The Core Engine is frozen and its internal structure is opaque to the UI.

# Research: Apple Store UI/UX Redesign

**Feature**: 001-apple-store-ui

## Background

The feature requires adapting the Apple Store UI/UX design (focusing on strictly light mode, pristine white layout) for the web lunar calendar application. The project is an offline-first vanilla TypeScript/HTML/CSS application without heavy frontend frameworks (no React/Vue) and no existing CSS frameworks (no Tailwind).

## 1. Typography Scale and Weights

**Decision**: Implement a custom CSS variables scale inspired by Apple's San Francisco (SF Pro) typography principles.
- Use system fonts heavily weighting `-apple-system, BlinkMacSystemFont, "SF Pro", "Helvetica Neue", Helvetica, Arial, sans-serif`.
- Define a modular scale for headers (e.g., extremely large `h1` for the month/year view) with tight tracking (letter-spacing: -0.015em to -0.02em).
- Use a high-contrast dark gray (`#1d1d1f`) rather than pure black for body text to reduce eye strain while maintaining a premium feel.

**Rationale**: Apple's modern web aesthetic relies heavily on large, bold, and clean typography that anchors the page layout.

## 2. Spatial Layout and Card Design

**Decision**: Adopt a card-based containment strategy for calendar dates and upcoming events.
- **Background**: Page background will be a very light gray (e.g., `#f5f5f7`) to allow white cards (`#ffffff`) to pop.
- **Border Radius**: Use large, soft border radii (`18px` to `24px`) for outer containers and event cards.
- **Shadows**: Use very subtle, diffuse box shadows (`box-shadow: 0 4px 24px rgba(0,0,0,0.04)`) to create depth without borders.

**Rationale**: The Apple Store heavily uses white rounded rectangles on light gray backgrounds to group related content, which perfectly fits the calendar grid and event lists.

## 3. Interaction and Animation

**Decision**: Implement smooth CSS transitions and transforms for interactive elements.
- **Hover States**: Cards should slightly scale up (`transform: scale(1.02)`) and increase shadow intensity on hover.
- **Transitions**: Use an Apple-like easing curve (`cubic-bezier(0.25, 0.1, 0.25, 1)`) for all transform and opacity changes, with duration around `0.3s`.
- **Modals/Overlays**: Modals should slide up smoothly from the bottom, or scale up from the center, with a translucent background backdrop (`backdrop-filter: blur(10px); background: rgba(0,0,0,0.2)` if acceptable, else simple opaque overlay).

**Rationale**: Fluid, physically-plausible animations are a hallmark of Apple's user experience.

## Alternatives Considered

- **Using a UI Library (e.g., Tailwind/Bootstrap)**: Rejected due to the project's existing vanilla CSS focus and Constitution Principle I & V (Simplicity Over Speculative Scalability).
- **Glassmorphism/Dark Mode**: Rejected based on user clarification to focus strictly on the pristine white light mode layout.

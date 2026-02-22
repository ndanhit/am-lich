# Research: Enhance UI/UX & Fix Feedbacks

This document captures technical research and decisions for Feature 003.

## Decision: Core Engine Expansion

### Decisions
1. **New Function**: Add `convertSolarToLunar(solarYear, solarMonth, solarDay)` to `converter.ts`.
2. **Library Usage**: Use `solar = Solar.fromYmd(y, m, d)` and `lunar = solar.getLunar()`.
3. **Caching**: Implement `solarToLunarCache` similar to existing `solarCache`.

### Rationale
- Minimizes expansion of the domain logic while providing necessary data for the UI.
- Reuses existing conversion library (`lunar-javascript`).

---

## Decision: Can Chi Mapping

### Decision
A static lookup table of 60 entries will map Chinese Can Chi characters (from `lunar.getYearInGanZhi()`) to Vietnamese names.

### Rationale
- `lunar-javascript` only returns Chinese characters or pinyin-style names.
- A 60-entry cycle is small enough to hardcode and ensures deterministic Vietnamese naming without external dependencies.

---

## Decision: UI Animation & Interaction

### Decisions
1. **Transitions**: Use CSS `transition: opacity, transform, background-color` for all state changes.
2. **Settings**: Reuse the `.modal-overlay` pattern from `app.ts` but style as a bottom sheet for mobile-first feel.
3. **Calendar Grid**: Force 42 cells by calculating leading/trailing days based on `Date` object math (Sunday start).

### Rationale
- Leveraging existing CSS variables ensures consistency.
- Bottom sheet is standard for modern mobile-responsive web apps.
- 42-cell grid prevents "jumping" layouts when navigating between months of different lengths.

---

## Alternatives Considered

- **Dynamic Can Chi mapping**: Rejected to avoid network dependency and non-deterministic behavior.
- **Route-based Settings**: Rejected to maintain current single-page-app simplicity and constitution principle of low complexity.

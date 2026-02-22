# Research: Lunar Event Manager

## 1. Needs Clarification / Technical Stack Decisions

### 1.1 Language/Version
**Decision**: TypeScript / Node.js (with cross-environment support, e.g. ESM).
**Rationale**: The Lunar Core Engine requires high determinism and functional purity per the project Constitution. TypeScript enforces type safety, ensuring domain models (e.g., Leap Month explicit rules, Lunar vs Solar structures) remain stable and catch errors at compile time. It also runs smoothly in a decoupled manner (UI-agnostic) on both server and browser via JS compilation.
**Alternatives considered**: Rust (excellent performance, strong types, but maybe overkill for this scope), Python (great scriptability, but slightly harder to run entirely client-side without network, which violates the offline-first rule if it requires a backend).

### 1.2 Primary Dependencies
**Decision**:
- Core Engine: No dependencies (Vanilla TS only) for mathematical conversions to enforce Constitution's "Framework Agnostic / Core must not import external APIs" rule.
- External adapters (optional): `date-fns` for standard Gregorian manipulations in the adapter layer.
**Rationale**: The core logic MUST be completely functionally pure. Adding dependencies for the lunar conversions introduces risk. We will implement standard Julian/Gregorian to Lunar mathematical algorithms based on well-known astronomical formulas or stable, tested lunar lookup algorithm ports.
**Alternatives considered**: Using an existing lunar calendar library (e.g., `lunar-javascript`). Rejected because relying on a 3rd-party library for the core domain rules (like explicit leap month handling matching our exact specs) might break the "Domain Stability Is Sacred" rule if the library updates. We will own the core math/lookup.

### 1.3 Target Platform & Project Type
**Decision**: Vanilla TypeScript Library / Core Engine.
**Rationale**: The Constitution states "The core engine must remain framework-agnostic and platform-independent." This implementation will solely be a library package exporting pure functions, which can later be consumed by an offline-capable web UI, CLI, or mobile app.
**Alternatives considered**: Building a full React/NextJS app immediately. Rejected because the Spec focuses heavily on the *Core Engine* constitution rule and the logic.

### 1.4 Storage (Offline-First)
**Decision**: LocalStorage / IndexedDB interface definitions (implemented via Adapters). The Core Engine itself will just accept and return JSON-serializable objects.
**Rationale**: Core must not know about storage. Adapters will handle the offline storage implementation.

## 2. Technical Approach Overview
To fulfill the requirements:
1. **Model**: Define immutable structures: `LunarEvent`, `LunarRule` (Regular, Leap, Both).
2. **Algorithm**: A Lunar-Solar conversion utility. Given the complexity of lunar phases and Vietnamese/Chinese timezone offsets, standard practice is to use a pre-calculated historical and future dataset (e.g. year 1900-2100) embedded as a lightweight lookup array, or an astronomical formula. We will design the interface to use a lookup/algorithm behind a pure function `convertToSolar(lunarDate, targetYear)`.
3. **Data Management**: Implement pure deterministic reducer-style functions for importing `importEvents(localState, importData) -> newState` following the ID-based overwrite/skip rules exactly.

# Lunar Core Engine Constitution

## Core Principles

### I. Functional Core First
All business logic must be implemented as pure, deterministic functions.

- No hidden state
- No side effects
- No implicit time dependency
- No direct access to storage, network, or UI

The core engine must remain framework-agnostic and platform-independent.

Adapters may depend on infrastructure.
Core must not.


### II. Domain Stability Is Sacred
The domain model is the foundation of the system and must remain stable.

- Events are defined strictly by lunarDay, lunarMonth, and isLeapMonth.
- Events are yearly recurring.
- Solar dates are computed, never persisted.
- Event year is never stored.

Domain contracts cannot be changed without:
- Specification update
- Explicit versioning
- Migration plan (if applicable)

Implementation may evolve.
Domain behavior must not drift.


### III. Deterministic Behavior (Non-Negotiable)
All system behavior must be explicit and testable.

This includes:

- Leap month fallback rules
- Event matching logic
- Upcoming event calculation
- Import conflict resolution

No silent corrections.
No hidden fallback.
No ambiguous rules.

If behavior cannot be precisely defined, it must not be implemented.


### IV. Offline-First by Design
The system must function completely without network connectivity.

- Local storage is the operational source of truth.
- Synchronization is optional and asynchronous.
- UI must not block on network.
- Core engine must not depend on sync logic.

Any architecture that introduces mandatory online dependency violates this constitution.


### V. Simplicity Over Speculative Scalability
The system assumes:

- A small dataset per user.
- All events can be loaded into memory.

Do not introduce premature optimization.
Do not design for hypothetical scale.
Clarity and maintainability take priority.


---

## Architectural Constraints

1. Core must not import:
   - Database drivers
   - HTTP clients
   - Framework APIs
   - Platform-specific modules

2. All external systems must be implemented as adapters.

3. Public function signatures are stable contracts.

4. Breaking changes require:
   - Version increment
   - Documentation update
   - Explicit justification


---

## Development Workflow

1. Specification precedes implementation.
2. Behavior must be defined before code is written.
3. Edge cases must be captured as tests before implementation.
4. All new features must:
   - Respect scope of current phase
   - Avoid hidden expansion of responsibilities
5. Code reviews must verify:
   - Functional purity
   - Boundary enforcement
   - Deterministic behavior


---

## Governance

This Constitution supersedes informal practices.

All pull requests and architectural changes must be evaluated against these principles.

Amendments require:

1. Written proposal
2. Rationale for change
3. Impact analysis
4. Version update of this Constitution

Violations must be corrected before merge.

---

**Version**: 1.0.0  
**Ratified**: 2026-02-22  
**Last Amended**: 2026-02-22
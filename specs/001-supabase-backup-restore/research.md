# Phase 0: Outline & Research

## Research 1: Supabase Shared Authentication Across Subdomains

**Context**: The requirement states that users logged into `pft.feedxiu.site` should automatically be authenticated on `lich.feedxiu.site`, leveraging the same Supabase project.

**Decision**: Configure the Supabase JS client (`@supabase/supabase-js`) to use a custom Cookie domain for storing the auth session, instead of the default `localStorage`.

**Rationale**: By setting `cookieOptions: { domain: '.feedxiu.site', secure: true, sameSite: 'lax' }` when initializing the Supabase client, the auth session cookie will be automatically shared across all subdomains under `feedxiu.site`. This ensures a seamless single sign-on (SSO) experience without needing manual token passing via URL schemas or cross-origin messaging. 

**Alternatives considered**: 
- Passing tokens via URL parameters (insecure and poor UX).
- Using a shared `localStorage` iframe proxy (complex, issues with third-party cookie blocking).

## Research 2: Data Model - Single Record JSON Payload

**Context**: The requirement is to store all events for a single user as a single combined record/payload optimized for < 1,000 events (under 1MB).

**Decision**: Create a Supabase PostgreSQL table named `user_backups` with columns: `user_id` (UUID, Primary Key, referencing `auth.users`), `events_payload` (JSONB), and `updated_at` (TIMESTAMP). 

**Rationale**: A single JSONB payload for events drastically simplifies the backup/restore logic. Instead of managing individual event inserts, updates, and deletes, the client can just issue an `UPSERT` with the entire events array. Supabase easily supports JSONB columns up to several megabytes, making this highly performant for < 1000 events.

**Alternatives considered**: 
- A normalized `events` table with one row per event (adds significant logic complexity for synchronizing deletions and updates, violating the simplicity principle in the constitution for this specific scoped feature).

## Research 3: Edge Cases - Strict Transaction Fallback for Restore

**Context**: The local restore must be an all-or-nothing transaction. If saving fails, the local storage must remain untouched.

**Decision**: Perform the restore flow completely in memory and only commit to `localStorage` as the final, infallible step.

**Rationale**: Read from `localStorage` -> Read from `Supabase` -> Parse JSON -> Set App State in Memory -> Save to `localStorage`. Because `localStorage.setItem()` is synchronous and atomic, if the Supabase network call fails, or the JSON parsing fails, the execution will throw an error and halt before `localStorage.setItem()` is ever called, preserving existing data perfectly.

**Alternatives considered**:
- Implementing an actual local SQLite transaction (over-engineered for the current web architecture).

## Research 4: Loading Indicator & UX

**Context**: Need to show a clear visual loading state/indicator to inform the user that a potentially slow process is running (FR-008).

**Decision**: Introduce a global or inline blocking overlay loader during the `await` calls to Supabase. This will prevent users from clicking buttons multiple times while the async request takes place. We will add a small inline spinner icon or button state `disabled` to the backup/restore buttons.

**Rationale**: Standard, predictable UX that maps well to the existing UI architecture in `am-lich`.

# Data Model: Supabase Backup and Restore

## Supabase Tables

### 1. `user_events_backup`

Stores the single JSONB payload containing all events for a given authenticated user.

| Column            | Type        | Constraints                             | Description                                                                 |
|-------------------|-------------|-----------------------------------------|-----------------------------------------------------------------------------|
| `id`              | UUID        | Primary Key, Default: `uuid_generate_v4()` | Unique identifier for the backup record.                                    |
| `user_id`         | UUID        | Foreign Key (`auth.users.id`), Unique   | References the authenticated Supabase user. Unique ensures 1 record per user. |
| `events_payload`  | JSONB       | Not Null                                | The raw JSON array of event objects.                                        |
| `updated_at`      | TIMESTAMP   | Default: `now()`                        | Automatically updated when a backup is written.                             |

## Row Level Security (RLS) Policies

All operations to the `user_events_backup` table are restricted to the authenticated user owning the row.

- **SELECT**: `auth.uid() = user_id`
- **INSERT**: `auth.uid() = user_id`
- **UPDATE**: `auth.uid() = user_id`
- **DELETE**: `auth.uid() = user_id`

## Entities

### RemoteEventPayload

The internal structure expected within the `events_payload` JSONB column.

```typescript
type RemoteEventPayload = Array<{
  id: string; // Unique identifier (UUID or generated ID)
  title: string;
  lunarDay: number;
  lunarMonth: number;
  isLeapMonth: boolean;
  description?: string;
  // Any other existing fields from the local event schema
}>;
```

This acts as an opaque blob to Supabase, but strictly mirrors the `am-lich` local storage events array.

# Quickstart: Supabase Integration

## 1. Environment Setup

Copy `.env.example` to `.env` (if not already present), and populate it with the remote Supabase project values for `pft.feedxiu.site`.

```bash
VITE_SUPABASE_URL=https://[YOUR_PROJECT_REF].supabase.co
VITE_SUPABASE_ANON_KEY=[YOUR_ANON_KEY]
```

## 2. Supabase SQL Migration (Remote)

To provision the required database schema, run the following SQL commands in your Supabase SQL Editor:

```sql
-- Create the table
CREATE TABLE public.user_events_backup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE,
    events_payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.user_events_backup ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can insert their own backup" 
ON public.user_events_backup FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can query their own backup" 
ON public.user_events_backup FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own backup" 
ON public.user_events_backup FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backup" 
ON public.user_events_backup FOR DELETE 
USING (auth.uid() = user_id);
```

## 3. Shared Cookie Configuration

Ensure your Supabase Client in `am-lich` is instantiated to allow shared cookies across both domains (e.g., `.feedxiu.site`):

```typescript
import { createClient } from '@supabase/supabase-js'

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storageKey: 'supabase-auth-token',
    cookieOptions: {
      domain: '.feedxiu.site',
      secure: true,
      sameSite: 'Lax',
    }
  }
});
```

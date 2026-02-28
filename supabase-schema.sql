-- Run these commands in your Supabase SQL Editor to provision the sync table.

-- Create the table
CREATE TABLE public.lich_user_events_backup (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
    events_payload JSONB NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id) -- Ensures 1 backup record max per user
);

-- Enable Row Level Security (RLS)
ALTER TABLE public.lich_user_events_backup ENABLE ROW LEVEL SECURITY;

-- Create policies so users can ONLY interact with their own backups

CREATE POLICY "Users can insert their own backup" 
ON public.lich_user_events_backup FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can query their own backup" 
ON public.lich_user_events_backup FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can update their own backup" 
ON public.lich_user_events_backup FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own backup" 
ON public.lich_user_events_backup FOR DELETE 
USING (auth.uid() = user_id);

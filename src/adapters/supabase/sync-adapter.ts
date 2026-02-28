import type { LunarEvent } from '../../lib/index';
import { supabase } from './client';

// Note: Actual implementations will be added in Phase 3 & 4

export class SyncAdapter {
    /**
     * Backs up all local events to the Supabase cloud database.
     * Replaces the remote JSON payload with these events.
     * @param events The complete list of local events
     */
    static async backupEvents(events: LunarEvent[]): Promise<void> {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) {
            throw new Error('User not authenticated');
        }

        const payload = {
            user_id: authData.user.id,
            events_payload: events,
            updated_at: new Date().toISOString()
        };

        const { error: upsertError } = await supabase
            .from('lich_user_events_backup')
            .upsert(payload, { onConflict: 'user_id' });

        if (upsertError) {
            throw new Error(`Backup failed: ${upsertError.message}`);
        }
    }

    /**
     * Retrieves all previously backed up events from the Supabase cloud database.
     * @returns The remote events, or null if no backup exists or user is unauthenticated
     */
    static async restoreEvents(): Promise<LunarEvent[] | null> {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) {
            throw new Error('User not authenticated');
        }

        const { data, error: selectError } = await supabase
            .from('lich_user_events_backup')
            .select('events_payload')
            .eq('user_id', authData.user.id)
            .single();

        if (selectError) {
            // PGRST116 means zero rows found exactly - we return null for "no backup found"
            if (selectError.code === 'PGRST116') {
                return null;
            }
            throw new Error(`Restore failed: ${selectError.message}`);
        }

        if (!data || !data.events_payload) {
            return null;
        }

        return data.events_payload as LunarEvent[];
    }

    /**
     * Get the current authenticated user
     */
    static async getUser() {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) return null;
        return data.user;
    }

    /**
     * Sign out the user
     */
    static async signOut() {
        await supabase.auth.signOut();
    }

    /**
     * Sign in with Email and Password
     */
    static async signInWithEmail(email: string, password: string) {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password
        });
        if (error) throw error;
        return data;
    }

    /**
     * Sign up with Email and Password
     */
    static async signUpWithEmail(email: string, password: string) {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                emailRedirectTo: window.location.origin
            }
        });
        if (error) throw error;
        return data;
    }
}

import type { LunarEvent, ExportPayload } from '../../lib/index';
import { supabase } from './client';

// Note: Actual implementations will be added in Phase 3 & 4

export class SyncAdapter {
    /**
     * Back up the full export payload (events + memos + people + families +
     * settings) to the Supabase cloud. The remote `events_payload` column is
     * reused as a generic JSON blob — kept the column name for backwards
     * compatibility with existing backups (older clients stored a plain event
     * array there, which `restoreAll` still understands).
     */
    static async backupAll(payload: ExportPayload): Promise<void> {
        const { data: authData, error: authError } = await supabase.auth.getUser();
        if (authError || !authData?.user) {
            throw new Error('User not authenticated');
        }

        const row = {
            user_id: authData.user.id,
            events_payload: payload,
            updated_at: new Date().toISOString()
        };

        const { error: upsertError } = await supabase
            .from('lich_user_events_backup')
            .upsert(row, { onConflict: 'user_id' });

        if (upsertError) {
            throw new Error(`Backup failed: ${upsertError.message}`);
        }
    }

    /**
     * Restore the full export payload from cloud. Returns null if no backup
     * exists. If the remote shape is an older "events-only" array (pre-genealogy
     * clients), it's wrapped into a minimal ExportPayload so callers always
     * receive the same shape.
     */
    static async restoreAll(): Promise<ExportPayload | null> {
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

        const raw = data.events_payload as unknown;
        // Legacy: events_payload was just an array of events. Wrap so the
        // caller can treat both old and new backups uniformly.
        if (Array.isArray(raw)) {
            return {
                version: 1,
                exportedAt: Date.now(),
                events: raw as LunarEvent[],
            };
        }
        return raw as ExportPayload;
    }

    /** @deprecated Use {@link backupAll} — kept for callers that haven't migrated. */
    static async backupEvents(events: LunarEvent[]): Promise<void> {
        await this.backupAll({
            version: 1,
            exportedAt: Date.now(),
            events,
        });
    }

    /** @deprecated Use {@link restoreAll}. Returns just the events list from
     *  whatever shape the remote stored. */
    static async restoreEvents(): Promise<LunarEvent[] | null> {
        const payload = await this.restoreAll();
        return payload ? payload.events : null;
    }

    /**
     * Get the current authenticated user (validates JWT with server).
     * Use for security-sensitive operations (backup/restore).
     */
    static async getUser() {
        const { data, error } = await supabase.auth.getUser();
        if (error || !data?.user) return null;
        return data.user;
    }

    /**
     * Get the current session from local storage (no network call).
     * Use for UI display purposes only.
     */
    static async getSession() {
        const { data, error } = await supabase.auth.getSession();
        if (error || !data?.session) return null;
        return data.session.user;
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

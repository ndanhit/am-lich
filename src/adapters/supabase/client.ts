import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// @ts-ignore
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
    auth: {
        storageKey: 'supabase-auth-token',
        storage: {
            getItem: (key) => {
                const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
                return match ? decodeURIComponent(match[2]) : null;
            },
            setItem: (key, value) => {
                document.cookie = `${key}=${encodeURIComponent(value)}; domain=.feedxiu.site; path=/; max-age=31536000; SameSite=Lax; Secure`;
            },
            removeItem: (key) => {
                document.cookie = `${key}=; domain=.feedxiu.site; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            }
        }
    }
});

import { createClient } from '@supabase/supabase-js';

// @ts-ignore
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';

// @ts-ignore
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

const hostname = typeof window !== 'undefined' ? window.location.hostname : '';
const isLocalhost = hostname === 'localhost' || hostname === '127.0.0.1' || hostname.startsWith('192.168.') || hostname.startsWith('10.');
const cookieDomainAttr = isLocalhost ? '' : '; domain=.feedxiu.site';
const secureAttr = isLocalhost ? '' : '; Secure';

export const supabase = createClient(supabaseUrl || 'https://placeholder.supabase.co', supabaseAnonKey || 'placeholder', {
    auth: {
        storageKey: 'supabase-auth-token',
        storage: {
            getItem: (key) => {
                const match = document.cookie.match(new RegExp(`(^| )${key}=([^;]+)`));
                return match ? decodeURIComponent(match[2]) : null;
            },
            setItem: (key, value) => {
                document.cookie = `${key}=${encodeURIComponent(value)}${cookieDomainAttr}; path=/; max-age=31536000; SameSite=Lax${secureAttr}`;
            },
            removeItem: (key) => {
                document.cookie = `${key}=${cookieDomainAttr}; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT`;
            }
        }
    }
});

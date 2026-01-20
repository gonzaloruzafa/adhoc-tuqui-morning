import { createClient, SupabaseClient } from '@supabase/supabase-js'

let serverClient: SupabaseClient | null = null
let browserClient: SupabaseClient | null = null

/**
 * Get the Supabase Admin client (singleton)
 * ONLY FOR SERVER-SIDE USE. Uses service role key.
 */
export function getAdminClient(): SupabaseClient {
    if (typeof window !== 'undefined') {
        throw new Error('getAdminClient cannot be called from the browser. Use getAnonClient instead.')
    }

    if (serverClient) {
        return serverClient
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
        throw new Error(
            'Missing Supabase Admin environment variables. ' +
            'Required: NEXT_PUBLIC_SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY'
        )
    }

    serverClient = createClient(url, serviceKey, {
        auth: {
            persistSession: false,
            autoRefreshToken: false,
        }
    })

    return serverClient
}

/**
 * Get the Supabase Anon client (singleton)
 * Safe for both client and server side.
 */
export function getAnonClient(): SupabaseClient {
    if (browserClient) {
        return browserClient
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY

    if (!url || !anonKey) {
        throw new Error(
            'Missing Supabase Anon environment variables. ' +
            'Required: NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY'
        )
    }

    browserClient = createClient(url, anonKey)

    return browserClient
}

/**
 * Backward compatibility: Alias for getAdminClient (Threw on client)
 */
export function getClient(): SupabaseClient {
    return getAdminClient()
}

/**
 * Check if user is admin
 */
export async function isUserAdmin(email: string): Promise<boolean> {
    const db = getClient()
    return email === 'gonzalo@adhoc.com.ar'
}

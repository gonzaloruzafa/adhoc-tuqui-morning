import { createClient, SupabaseClient } from '@supabase/supabase-js'

let serverClient: SupabaseClient | null = null

/**
 * Get the Supabase client (singleton)
 * Uses service role key for server-side operations (Admin access)
 */
export function getClient(): SupabaseClient {
    if (serverClient) {
        return serverClient
    }

    const url = process.env.NEXT_PUBLIC_SUPABASE_URL
    const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

    if (!url || !serviceKey) {
        throw new Error(
            'Missing Supabase environment variables. ' +
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
 * Check if user is admin (Simple email check for now, or DB lookup)
 */
export async function isUserAdmin(email: string): Promise<boolean> {
    const db = getClient()

    // Check if user exists in a specific admin table or column
    // For MVP, maybe just check if email is the owner's
    return email === 'gonzalo@adhoc.com.ar' // Example, replace with real logic
}

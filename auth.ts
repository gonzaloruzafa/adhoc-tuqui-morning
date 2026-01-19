import NextAuth from "next-auth"
import { authConfig } from "./auth.config"

export const { handlers, auth, signIn, signOut } = NextAuth({
    ...authConfig,
    callbacks: {
        ...authConfig.callbacks,
        async signIn({ user, account, profile }) {
            if (account && account.provider === 'google') {
                try {
                    const { getClient } = await import("@/lib/supabase/client")
                    const { encrypt } = await import("@/lib/crypto")
                    const db = getClient()

                    // Upsert User
                    const { error: userError } = await db
                        .from('tuqui_morning_users')
                        .upsert({
                            email: user.email,
                            name: user.name,
                            image: user.image,
                            updated_at: new Date().toISOString(),
                        }, { onConflict: 'email' })

                    if (userError) console.error("Error upserting user:", userError)

                    // Upsert Tokens
                    if (account.access_token && account.refresh_token) {
                        const { error: tokenError } = await db
                            .from('tuqui_morning_oauth_tokens')
                            .upsert({
                                user_email: user.email,
                                provider: 'google',
                                access_token_enc: encrypt(account.access_token),
                                refresh_token_enc: encrypt(account.refresh_token),
                                expires_at: new Date((account.expires_at || 0) * 1000).toISOString(),
                                scopes: account.scope?.split(' ') || [],
                                updated_at: new Date().toISOString(),
                            }, { onConflict: 'user_email, provider' })

                        if (tokenError) console.error("Error saving tokens:", tokenError)
                    }

                    // ========================================
                    // Tuqui v2.0: Trigger Profile Analysis & Welcome Run
                    // ========================================
                    const { data: userData } = await db
                        .from('tuqui_morning_users')
                        .select('profile_analysis_status, onboarding_completed')
                        .eq('email', user.email)
                        .single();

                    if (!userData || userData.profile_analysis_status === 'pending') {
                        const baseUrl = process.env.NEXTAUTH_URL || 'http://localhost:3000';

                        // 1. Create Default Schedule (M-F at 7 AM)
                        const { calculateNextRunAt } = await import("@/lib/scheduler");
                        const defaultTime = "07:00";
                        const defaultTZ = "America/Argentina/Buenos_Aires";
                        const nextRunAt = calculateNextRunAt(defaultTime, defaultTZ);

                        await db.from('tuqui_morning_schedules').upsert({
                            user_email: user.email,
                            time_local: defaultTime,
                            enabled: true,
                            days_of_week: [1, 2, 3, 4, 5],
                            next_run_at: nextRunAt.toISOString(),
                            updated_at: new Date().toISOString()
                        }, { onConflict: 'user_email' });

                        // 2. Trigger Profile Analysis (Async)
                        fetch(`${baseUrl}/api/internal/analyze-profile`, {
                            method: 'POST',
                            headers: { 'Content-Type': 'application/json' },
                            body: JSON.stringify({ userEmail: user.email })
                        }).catch(e => console.error("Profile analysis trigger failed:", e));

                        // 3. Trigger Welcome Briefing (Async)
                        // Create a manual run for right now
                        const { data: welcomeRun } = await db
                            .from('tuqui_morning_runs')
                            .insert({
                                user_email: user.email,
                                scheduled_for: new Date().toISOString(),
                                status: 'pending'
                            })
                            .select()
                            .single();

                        if (welcomeRun) {
                            fetch(`${baseUrl}/api/internal/run-pipeline`, {
                                method: 'POST',
                                headers: { 'Content-Type': 'application/json' },
                                body: JSON.stringify({ runId: welcomeRun.id })
                            }).catch(e => console.error("Welcome briefing trigger failed:", e));
                        }
                    }
                } catch (e) {
                    console.error("SignIn callback error:", e)
                    return false
                }
            }
            return true
        },
        async jwt({ token, account }) {
            if (account) {
                token.accessToken = account.access_token
                token.expiresAt = account.expires_at
            }
            return token
        },
        async session({ session, token }) {
            session.accessToken = token.accessToken as string
            return session
        },
    },
})

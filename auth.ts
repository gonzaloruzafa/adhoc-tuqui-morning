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

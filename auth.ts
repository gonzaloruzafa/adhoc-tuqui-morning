import NextAuth, { NextAuthConfig } from "next-auth"
import Google from "next-auth/providers/google"

export const authConfig = {
    // Secret for signing the session
    secret: process.env.AUTH_SECRET,
    providers: [
        Google({
            clientId: process.env.GOOGLE_CLIENT_ID,
            clientSecret: process.env.GOOGLE_CLIENT_SECRET,
            authorization: {
                params: {
                    scope: [
                        "openid",
                        "email",
                        "profile",
                        "https://www.googleapis.com/auth/gmail.readonly",
                        "https://www.googleapis.com/auth/calendar.readonly",
                    ].join(" "),
                    access_type: "offline",
                    prompt: "consent",
                },
            },
        }),
    ],
    pages: {
        signIn: "/login", // Custom login page
        error: "/login",
    },
    debug: process.env.NODE_ENV === 'development',
    callbacks: {
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
                    return false // Deny sign in on critical error? Maybe just log.
                }
            }
            return true
        },
        authorized({ auth, request: { nextUrl } }) {
            const isLoggedIn = !!auth?.user
            const isOnLogin = nextUrl.pathname === "/login"

            // Allow public assets and api
            if (nextUrl.pathname.startsWith("/api/auth")) return true
            if (nextUrl.pathname.startsWith("/_next")) return true
            if (nextUrl.pathname.startsWith("/public")) return true

            // Redirect to login if not logged in
            if (!isLoggedIn && !isOnLogin) {
                return false; // Redirect to login
            }

            // Redirect to home if logged in and on login page
            if (isLoggedIn && isOnLogin) {
                return Response.redirect(new URL("/", nextUrl))
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
} satisfies NextAuthConfig

export const { handlers, auth, signIn, signOut } = NextAuth(authConfig)

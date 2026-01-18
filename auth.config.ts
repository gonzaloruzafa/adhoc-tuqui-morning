import type { NextAuthConfig } from "next-auth"
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
        signIn: "/login",
        error: "/login",
    },
    callbacks: {
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
    },
} satisfies NextAuthConfig

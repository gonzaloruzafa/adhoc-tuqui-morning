import { google } from "googleapis";
import { getClient } from "@/lib/supabase/client";
import { decrypt, encrypt } from "@/lib/crypto";

const oauth2Client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    process.env.NEXTAUTH_URL // Redirect URL
);

export async function getValidAccessToken(userEmail: string) {
    const db = getClient();

    // 1. Get tokens from DB
    const { data: tokenData, error } = await db
        .from("tuqui_morning_oauth_tokens")
        .select("*")
        .eq("user_email", userEmail)
        .single();

    if (error || !tokenData) {
        throw new Error(`No tokens found for user ${userEmail}`);
    }

    const refreshToken = decrypt(tokenData.refresh_token_enc);
    const accessToken = decrypt(tokenData.access_token_enc);
    const expiryDate = new Date(tokenData.expires_at).getTime();

    // 2. Set credentials
    oauth2Client.setCredentials({
        access_token: accessToken,
        refresh_token: refreshToken,
        expiry_date: expiryDate,
    });

    // 3. Check if expired (or close to expiring, e.g. within 5 mins)
    const isExpired = Date.now() >= (expiryDate - 5 * 60 * 1000);

    if (isExpired) {
        console.log(`Token expired for ${userEmail}, refreshing...`);
        try {
            const { credentials } = await oauth2Client.refreshAccessToken();

            // Update DB
            if (credentials.access_token) {
                await db
                    .from("tuqui_morning_oauth_tokens")
                    .update({
                        access_token_enc: encrypt(credentials.access_token),
                        // Refresh token might be rotated, update if present
                        ...(credentials.refresh_token ? { refresh_token_enc: encrypt(credentials.refresh_token) } : {}),
                        expires_at: new Date(credentials.expiry_date || Date.now() + 3600 * 1000).toISOString(),
                        updated_at: new Date().toISOString(),
                    })
                    .eq("user_email", userEmail);

                return credentials.access_token;
            }
        } catch (refreshError) {
            console.error("Failed to refresh token", refreshError);
            throw new Error("Failed to refresh token");
        }
    }

    return accessToken;
}

export function getAuthorizedClient(accessToken: string) {
    const auth = new google.auth.OAuth2();
    auth.setCredentials({ access_token: accessToken });
    return auth;
}

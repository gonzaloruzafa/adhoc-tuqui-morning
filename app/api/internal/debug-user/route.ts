import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { getClient } from "@/lib/supabase/client";

/**
 * Debug endpoint to check user's WhatsApp configuration
 */
export async function GET() {
    try {
        const session = await auth();
        if (!session?.user?.email) {
            return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
        }

        const db = getClient();

        // Get user data
        const { data: user, error: userError } = await db
            .from("tuqui_morning_users")
            .select("*")
            .eq("email", session.user.email)
            .single();

        if (userError || !user) {
            return NextResponse.json({ error: "User not found", details: userError }, { status: 404 });
        }

        // Get schedule data
        const { data: schedule } = await db
            .from("tuqui_morning_schedules")
            .select("*")
            .eq("user_email", session.user.email)
            .single();

        // Get recent WhatsApp messages
        const { data: messages } = await db
            .from("tuqui_morning_whatsapp_messages")
            .select("*")
            .eq("user_email", session.user.email)
            .order("created_at", { ascending: false })
            .limit(5);

        // Check if window is active
        const now = new Date();
        const expiresAt = user.whatsapp_window_expires_at ? new Date(user.whatsapp_window_expires_at) : null;
        const isWindowOpen = user.whatsapp_status === 'active' && expiresAt && expiresAt > now;

        return NextResponse.json({
            user: {
                email: user.email,
                name: user.name,
                phone_whatsapp: user.phone_whatsapp,
                whatsapp_status: user.whatsapp_status,
                whatsapp_window_expires_at: user.whatsapp_window_expires_at,
                whatsapp_last_interaction_at: user.whatsapp_last_interaction_at,
                whatsapp_last_error: user.whatsapp_last_error,
                onboarding_completed: user.onboarding_completed,
            },
            schedule: schedule || null,
            window: {
                isOpen: isWindowOpen,
                expiresAt: expiresAt?.toISOString() || null,
                timeUntilExpiry: expiresAt ? Math.round((expiresAt.getTime() - now.getTime()) / 1000 / 60) + " min" : null,
            },
            recentMessages: messages || [],
            diagnosis: {
                phoneConfigured: !!user.phone_whatsapp,
                phoneFormat: user.phone_whatsapp,
                expectedFormat: "+5493416718905",
                windowActive: isWindowOpen,
                canReceiveMessages: isWindowOpen && !!user.phone_whatsapp,
            }
        });

    } catch (error: any) {
        console.error("[Debug User] Error:", error);
        return NextResponse.json({ error: "Internal error", details: error.message }, { status: 500 });
    }
}

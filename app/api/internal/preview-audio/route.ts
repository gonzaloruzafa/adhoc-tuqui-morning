import { auth } from "@/auth";
import { getClient } from "@/lib/supabase/client";
import { getValidAccessToken } from "@/lib/google/auth";
import { fetchRecentEmails } from "@/lib/google/gmail";
import { fetchTodayEvents } from "@/lib/google/calendar";
import { getTopImportantEmails, categorizeEvents } from "@/lib/intelligence/heuristics";
import { generateBriefingPrompt, generateBriefingScript } from "@/lib/intelligence/briefing";
import { generateAudio } from "@/lib/audio/tts";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    try {
        const db = getClient();

        // 1. Get User Config
        const { data: user } = await db
            .from("tuqui_morning_users")
            .select("*")
            .eq("email", session.user.email)
            .single();

        if (!user) return NextResponse.json({ error: "User not found" }, { status: 404 });

        // 2. Auth Google
        // Note: If no token, this might fail. We assume user has logged in via Google.
        const accessToken = await getValidAccessToken(user.email);

        // 3. Fetch Data (Parallel)
        const [emails, events] = await Promise.all([
            fetchRecentEmails(accessToken, { hoursBack: 24 }).catch(e => {
                console.error("Email fetch failed", e);
                return [];
            }),
            fetchTodayEvents(accessToken, user.timezone).catch(e => {
                console.error("Event fetch failed", e);
                return [];
            })
        ]);

        // 4. Intelligence
        const importantEmails = getTopImportantEmails(emails, user.email.split("@")[1]);
        const categorizedEvents = categorizeEvents(events);

        // 5. Generate Script
        const prompt = generateBriefingPrompt({
            userName: user.name || "Usuario",
            date: new Date(),
            timezone: user.timezone,
            events: categorizedEvents,
            emails: importantEmails.map(e => ({ email: e.email })),
        });

        const { script } = await generateBriefingScript(prompt);

        // 6. Generate Audio
        let audioUrl = null;
        try {
            const { url } = await generateAudio(script, user.id);
            audioUrl = url;
        } catch (ttsError: any) {
            console.error("TTS Failed during preview:", ttsError);
            return NextResponse.json({ error: "TTS Generation Failed: " + ttsError.message }, { status: 500 });
        }

        return NextResponse.json({
            success: true,
            audioUrl,
            script
        });

    } catch (error: any) {
        console.error("Preview failed:", error);
        return NextResponse.json({ error: error.message || "Preview failed" }, { status: 500 });
    }
}

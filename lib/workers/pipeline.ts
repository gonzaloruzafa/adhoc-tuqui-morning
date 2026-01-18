import { getClient } from "@/lib/supabase/client";
import { getValidAccessToken } from "@/lib/google/auth";
import { fetchRecentEmails } from "@/lib/google/gmail";
import { fetchTodayEvents } from "@/lib/google/calendar";
import { getTopImportantEmails, categorizeEvents } from "@/lib/intelligence/heuristics";
import { generateBriefingPrompt, generateBriefingScript } from "@/lib/intelligence/briefing";
import { generateAudio } from "@/lib/audio/tts";
import { sendWhatsAppAudio } from "@/lib/twilio/client";

export async function processRun(runId: string) {
    const db = getClient();

    // 1. Fetch Run & User
    const { data: run, error: runError } = await db
        .from("tuqui_morning_runs")
        .select(`*, tuqui_morning_users!inner(*)`)
        .eq("id", runId)
        .single();

    if (runError || !run) throw new Error("Run not found");
    const user = run.tuqui_morning_users;

    // Update Status: Running
    await db.from("tuqui_morning_runs").update({ status: "running", started_at: new Date() }).eq("id", runId);

    try {
        // 2. Auth
        const accessToken = await getValidAccessToken(user.email);

        // 3. Fetch Data
        const [emails, events] = await Promise.all([
            fetchRecentEmails(accessToken, { hoursBack: 24 }),
            fetchTodayEvents(accessToken, user.timezone)
        ]);

        // 4. Intelligence
        const importantEmails = getTopImportantEmails(emails, user.email.split("@")[1]);
        const categorizedEvents = categorizeEvents(events);

        // 5. Generate Script
        const prompt = generateBriefingPrompt({
            userName: user.name || "Usuario",
            date: new Date(run.scheduled_for),
            timezone: user.timezone,
            events: categorizedEvents,
            emails: importantEmails.map(e => ({ email: e.email })), // Adapt structure
        });

        const { script } = await generateBriefingScript(prompt);

        // 6. Audio
        let audioUrl = null;
        try {
            const { url } = await generateAudio(script, user.id);
            audioUrl = url;
        } catch (ttsError) {
            console.error("TTS Failed, continuing with text only", ttsError);
        }

        // 7. Save Output
        await db.from("tuqui_morning_outputs").insert({
            run_id: runId,
            user_email: user.email,
            text_content: script,
            audio_url: audioUrl,
            delivery_status: "pending"
        });

        // 8. Delivery
        if (user.phone_whatsapp) {
            await sendWhatsAppAudio(user.phone_whatsapp, audioUrl, script, user.email);
            await db.from("tuqui_morning_outputs").update({ delivery_status: "delivered" }).eq("run_id", runId); // Simplified status update
        }

        // 9. Complete
        await db.from("tuqui_morning_runs").update({ status: "completed", finished_at: new Date() }).eq("id", runId);

        return { success: true };

    } catch (error: any) {
        console.error("Pipeline failed:", error);
        await db.from("tuqui_morning_runs").update({ status: "failed", error_message: error.message }).eq("id", runId);
        throw error;
    }
}

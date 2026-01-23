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

    // Fetch Profile if available
    const { data: profile } = await db
        .from("tuqui_morning_user_profiles")
        .select("*")
        .eq("user_email", user.email)
        .single();

    // Update Status: Running
    await db.from("tuqui_morning_runs").update({ status: "running", started_at: new Date().toISOString() }).eq("id", runId);

    try {
        // 2. Auth
        const accessToken = await getValidAccessToken(user.email);

        // 3. Fetch Data (Resilient)
        const newsQuery = profile?.inferred_industry || (profile?.recurring_topics?.[0]) || "negocio y tecnologia";

        const [emails, events, news] = await Promise.all([
            fetchRecentEmails(accessToken, { hoursBack: 24 }).catch(e => {
                console.error("Pipeline: Gmail fetch failed", e);
                return [];
            }),
            fetchTodayEvents(accessToken, user.timezone).catch(e => {
                console.error("Pipeline: Calendar fetch failed", e);
                return [];
            }),
            import("@/lib/intelligence/news").then(m => m.fetchRelevantNews(newsQuery)).catch(e => {
                console.error("Pipeline: News fetch failed", e);
                return [];
            })
        ]);

        // 4. Intelligence
        const vipEmails = profile?.vip_contacts?.map((c: any) => c.email.toLowerCase()) || [];
        const vipDomains = (profile?.vip_domains || []) as string[];
        const vipList = [...vipEmails, ...vipDomains];

        const importantEmails = getTopImportantEmails(
            emails,
            user.email.split("@")[1],
            vipList
        ).map(e => ({
            email: e.email,
            isVIP: vipEmails.includes(e.email.fromEmail.toLowerCase()) ||
                vipDomains.some(d => e.email.fromEmail.toLowerCase().includes(d.toLowerCase()))
        }));

        const categorizedEvents = categorizeEvents(events);

        // 5. Generate Script
        const prompt = generateBriefingPrompt({
            userName: user.name || "Usuario",
            date: new Date(run.scheduled_for),
            timezone: user.timezone,
            events: categorizedEvents.map(ce => ({
                title: ce.event.title,
                startTime: ce.event.startTime,
                priority: ce.priority
            })),
            emails: importantEmails,
            news: news, // NEW
            profile: profile as any,
        });

        const { script } = await generateBriefingScript(prompt);

        // 6. Audio
        console.log(`[Pipeline] 🎵 Starting audio generation for user: ${user.email}`);
        let audioUrl = null;
        try {
            const { url } = await generateAudio(script, user.id);
            audioUrl = url;
            console.log(`[Pipeline] ✅ Audio generated successfully: ${url}`);
        } catch (ttsError: any) {
            console.error("[Pipeline] ❌ TTS FAILED - continuing with text only");
            console.error("[Pipeline] TTS Error:", ttsError);
            console.error("[Pipeline] TTS Error message:", ttsError?.message);
            console.error("[Pipeline] TTS Error stack:", ttsError?.stack?.split('\n').slice(0, 5).join('\n'));
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
        console.log(`[Pipeline] 📤 Starting delivery. Audio URL: ${audioUrl ? 'PRESENT' : 'NULL'}`);

        // Generar link corto para el audio
        let shortAudioUrl = audioUrl;
        if (audioUrl) {
            const baseUrl = process.env.NEXTAUTH_URL || 'https://adhoc-tuqui-morning.vercel.app';
            shortAudioUrl = `${baseUrl}/api/audio/${runId}`;
            console.log(`[Pipeline] 🔗 Short audio URL: ${shortAudioUrl}`);
        }

        let delivered = false;
        if (user.phone_whatsapp) {
            console.log(`[Pipeline] 📱 Sending to WhatsApp: ${user.phone_whatsapp}`);
            const result = await sendWhatsAppAudio(user.phone_whatsapp, shortAudioUrl, script, user.email);
            if (result.success) {
                delivered = true;
                await db.from("tuqui_morning_outputs").update({ delivery_status: "delivered_whatsapp" }).eq("run_id", runId);
            } else if (result.error === "window_closed") {
                console.log(`[Pipeline] WhatsApp window closed for ${user.email}. Falling back to Email.`);
            }
        }

        if (!delivered) {
            console.log(`[Pipeline] Sending briefing via Email to ${user.email}`);
            const { sendEmail } = await import("@/lib/google/gmail");
            try {
                await sendEmail(accessToken, user.email, `Tuqui Morning: Briefing de hoy`, script);
                await db.from("tuqui_morning_outputs").update({ delivery_status: "delivered_email" }).eq("run_id", runId);
            } catch (emailError) {
                console.error("Pipeline: Email fallback failed", emailError);
                await db.from("tuqui_morning_outputs").update({ delivery_status: "failed" }).eq("run_id", runId);
            }
        }

        // 9. Complete
        await db.from("tuqui_morning_runs").update({ status: "completed", finished_at: new Date().toISOString() }).eq("id", runId);

        return { success: true };

    } catch (error: any) {
        console.error("Pipeline failed:", error);
        await db.from("tuqui_morning_runs").update({ status: "failed", error_message: error.message }).eq("id", runId);
        throw error;
    }
}

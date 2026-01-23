import twilio from "twilio";
import { getClient } from "@/lib/supabase/client";

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);

/**
 * Verifica si el usuario tiene una ventana de servicio de 24hs abierta
 */
export async function canSendToUser(userEmail: string): Promise<boolean> {
    const db = getClient();
    const { data } = await db
        .from("tuqui_morning_users")
        .select("whatsapp_status, whatsapp_window_expires_at")
        .eq("email", userEmail)
        .single();

    if (!data) return false;
    if (data.whatsapp_status !== 'active') return false;
    if (!data.whatsapp_window_expires_at) return false;

    const expiresAt = new Date(data.whatsapp_window_expires_at);
    return expiresAt > new Date();
}

export async function sendWhatsAppAudio(
    to: string,
    audioUrl: string | null,
    fallbackText: string,
    userEmail: string
) {
    // 1. Verificar ventana si no es el primer mensaje de onboarding
    const isWindowOpen = await canSendToUser(userEmail);
    if (!isWindowOpen) {
        console.log(`[Twilio] Window closed for ${userEmail}. Aborting WhatsApp delivery.`);
        return { success: false, error: "window_closed" };
    }

    const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER?.startsWith("whatsapp:")
        ? process.env.TWILIO_WHATSAPP_NUMBER
        : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

    if (!process.env.TWILIO_WHATSAPP_NUMBER) {
        throw new Error("Missing Twilio configuration");
    }

    try {
        let messageSid;

        if (audioUrl) {
            console.log(`[Twilio] Sending audio link message. URL: ${audioUrl}`);
            console.log(`[Twilio] From: ${fromNumber}, To: ${toNumber}`);

            // Mensaje 1: Audio link
            const audioMessage = await client.messages.create({
                from: fromNumber,
                to: toNumber,
                body: `🌅 *Aquí tenés tu Tuqui de hoy*

🎧 Escuchá tu briefing:
${audioUrl}`,
            });

            console.log(`[Twilio] Audio link message sent. SID: ${audioMessage.sid}`);
            messageSid = audioMessage.sid;

            // Mensaje 2: Botón interactivo de confirmación
            // IMPORTANTE: El botón debe tener ButtonPayload="confirm_yes" para que el webhook lo detecte
            // Cuando el usuario clickea el botón DENTRO de WhatsApp, Twilio envía webhook
            // Eso extiende la ventana REAL de WhatsApp (no solo nuestra DB)
            const buttonMessage = await client.messages.create({
                from: fromNumber,
                to: toNumber,
                contentSid: 'HX82d42aa48acc769a4c6d1c8234a2c852', // Content Template aprobado
            });

            console.log(`[Twilio] Confirmation button sent. SID: ${buttonMessage.sid}`);
        } else {
            // Solo texto (fallback cuando no hay audio)
            const message = await client.messages.create({
                from: fromNumber,
                to: toNumber,
                body: `🌅 Tu briefing:\n\n${fallbackText}`,
            });
            messageSid = message.sid;
        }

        // Log interaction in DB
        const db = getClient();
        await db.from("tuqui_morning_whatsapp_messages").insert({
            user_email: userEmail,
            direction: 'outbound',
            message_type: audioUrl ? 'audio' : 'text',
            content: audioUrl || fallbackText,
            twilio_message_sid: messageSid,
            triggered_by: 'daily_briefing'
        });

        return { success: true, messageSid };

    } catch (error: any) {
        console.error("WhatsApp delivery failed:", error);
        return { success: false, error: error.message };
    }
}

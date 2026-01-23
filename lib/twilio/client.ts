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

        // El CTA es crucial para mantener la ventana abierta mañana
        // TODO: Para producción, implementar botones interactivos usando Content Templates de Twilio
        // Ver: https://www.twilio.com/docs/whatsapp/buttons
        // Los botones requieren crear un Content Template con type "twilio/quick-reply"
        const CTA = "\n\n¿Mañana igual? Respondé 'Si' para confirmar.";

        if (audioUrl) {
            console.log(`[Twilio] Sending audio link message. URL: ${audioUrl}`);
            console.log(`[Twilio] From: ${fromNumber}, To: ${toNumber}`);

            // Mensaje con link al audio
            const audioMessage = await client.messages.create({
                from: fromNumber,
                to: toNumber,
                body: `🌅 *Aquí tenés tu Tuqui de hoy*

🎧 Escuchá tu briefing:
${audioUrl}`,
            });

            console.log(`[Twilio] Audio link message sent. SID: ${audioMessage.sid}`);
            messageSid = audioMessage.sid;

            // Mensaje con botón interactivo usando Content Template aprobado
            // Content Template SID: HX82d42aa48acc769a4c6d1c8234a2c852
            // Botón: "¡Dale!" (ID: 1)
            const buttonMessage = await client.messages.create({
                from: fromNumber,
                to: toNumber,
                contentSid: 'HX82d42aa48acc769a4c6d1c8234a2c852',
            });

            console.log(`[Twilio] Button message sent. SID: ${buttonMessage.sid}`);
        } else {
            // Solo texto
            const message = await client.messages.create({
                from: fromNumber,
                to: toNumber,
                body: `🌅 Tu briefing:\n\n${fallbackText}${CTA}`,
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

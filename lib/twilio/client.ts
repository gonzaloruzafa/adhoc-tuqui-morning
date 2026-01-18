import twilio from "twilio";
import { getClient } from "@/lib/supabase/client";

const client = twilio(
    process.env.TWILIO_ACCOUNT_SID!,
    process.env.TWILIO_AUTH_TOKEN!
);

export async function sendWhatsAppAudio(
    to: string,
    audioUrl: string | null,
    fallbackText: string,
    userEmail: string
) {
    // Ensure "to" has whatsapp prefix
    const toNumber = to.startsWith("whatsapp:") ? to : `whatsapp:${to}`;
    const fromNumber = process.env.TWILIO_WHATSAPP_NUMBER?.startsWith("whatsapp:")
        ? process.env.TWILIO_WHATSAPP_NUMBER
        : `whatsapp:${process.env.TWILIO_WHATSAPP_NUMBER}`;

    if (!process.env.TWILIO_WHATSAPP_NUMBER) {
        console.error("Missing Twilio configuration");
        throw new Error("Missing Twilio configuration");
    }

    try {
        let messageSid;

        if (audioUrl) {
            const message = await client.messages.create({
                from: fromNumber,
                to: toNumber,
                mediaUrl: [audioUrl],
            });
            messageSid = message.sid;
        } else {
            // Fallback to text
            const message = await client.messages.create({
                from: fromNumber,
                to: toNumber,
                body: `🌅 Tu briefing:\n\n${fallbackText}`,
            });
            messageSid = message.sid;
        }

        return { success: true, messageSid };

    } catch (error: any) {
        console.error("WhatsApp delivery failed:", error);

        // Attempt fallback text if audio failed
        if (audioUrl) {
            console.log("Attempting text fallback...");
            try {
                const message = await client.messages.create({
                    from: fromNumber,
                    to: toNumber,
                    body: `🌅 Tu briefing (Audio falló):\n\n${fallbackText}`,
                });
                return { success: true, messageSid: message.sid, isFallback: true };
            } catch (textError) {
                return { success: false, error: error.message };
            }
        }

        return { success: false, error: error.message };
    }
}

import { NextResponse } from "next/server";
import { getClient } from "@/lib/supabase/client";

/**
 * Webhook para Twilio WhatsApp
 * Gestiona la ventana de 24hs y las interacciones del usuario
 */
export async function POST(req: Request) {
    try {
        const formData = await req.formData();
        const from = formData.get("From") as string; // whatsapp:+XXXXXXXXXX
        const body = formData.get("Body") as string;
        const messageSid = formData.get("MessageSid") as string;

        if (!from) {
            console.error("[Twilio Webhook] Missing From number");
            return NextResponse.json({ error: "Missing From" }, { status: 400 });
        }

        const db = getClient();
        // Limpiar el prefijo whatsapp: para buscar en la base
        const cleanNumber = from.replace("whatsapp:", "").trim();

        console.log(`[Twilio Webhook] Looking for user with phone: "${cleanNumber}"`);

        // 1. Encontrar usuario por teléfono
        // Importante: El usuario debe haber guardado su teléfono en la config
        const { data: user, error: userError } = await db
            .from("tuqui_morning_users")
            .select("email, name, whatsapp_status, phone_whatsapp")
            .eq("phone_whatsapp", cleanNumber)
            .maybeSingle();

        console.log(`[Twilio Webhook] Query result:`, { user, userError });

        if (userError || !user) {
            console.warn(`[Twilio Webhook] Message from unknown number: ${from}. Message: ${body}`);

            // DEBUG: Let's see ALL users with phones to understand the mismatch
            const { data: allUsers } = await db
                .from("tuqui_morning_users")
                .select("email, phone_whatsapp")
                .not("phone_whatsapp", "is", null);
            console.log(`[Twilio Webhook DEBUG] All users with phones:`, allUsers);
            // Respondemos con éxito a Twilio para evitar reintentos, pero no hacemos nada
            return new Response("<Response/>", { headers: { "Content-Type": "text/xml" } });
        }

        const now = new Date();
        const expiresAt = new Date(now.getTime() + 24 * 60 * 60 * 1000);

        // 2. Actualizar estado de WhatsApp del usuario
        // Esto abre o extiende la ventana de 24hs sin costo para nosotros
        await db.from("tuqui_morning_users").update({
            whatsapp_status: 'active',
            whatsapp_window_expires_at: expiresAt.toISOString(),
            whatsapp_last_interaction_at: now.toISOString(),
            whatsapp_last_error: null // Limpiar errores previos si los hubiera
        }).eq("email", user.email);

        // 3. Registrar el mensaje en el historial
        await db.from("tuqui_morning_whatsapp_messages").insert({
            user_email: user.email,
            direction: 'inbound',
            message_type: 'text',
            content: body,
            twilio_message_sid: messageSid,
            triggered_by: 'user_reply'
        });

        console.log(`[Twilio Webhook] 24h Window ACTIVATED for ${user.email}. Expires: ${expiresAt.toISOString()}`);

        // 4. Lógica de respuesta automática (TwiML)
        let responseText = "";
        const lowerBody = body.toLowerCase().trim();

        if (lowerBody === "si" || lowerBody === "sí") {
            responseText = `¡Confirmado ${user.name}! Mañana te mando tu Tuqui a la hora de siempre. ☀️`;
        } else if (lowerBody.includes("hola") || lowerBody.includes("despertate")) {
            responseText = `¡Hola! Tuqui está despierto. A partir de ahora vas a recibir tus briefings diarios por acá.`;
        } else {
            // Respuesta genérica educada para mantener la ventana abierta
            responseText = "¡Recibido! Tu ventana de WhatsApp está activa por 24 horas más. Mañana seguimos.";
        }

        const twiml = `<?xml version="1.0" encoding="UTF-8"?><Response><Message>${responseText}</Message></Response>`;
        return new Response(twiml, {
            headers: { "Content-Type": "text/xml" },
        });

    } catch (error) {
        console.error("[Twilio Webhook] Error processing request:", error);
        return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
    }
}

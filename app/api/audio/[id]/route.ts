import { NextResponse } from "next/server";
import { getClient } from "@/lib/supabase/client";

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ id: string }> }
) {
    const { id } = await params;

    // Buscar el output con este run_id
    const db = getClient();
    const { data: output } = await db
        .from("tuqui_morning_outputs")
        .select("audio_url, user_email")
        .eq("run_id", id)
        .single();

    if (!output?.audio_url) {
        return new NextResponse("Audio not found", { status: 404 });
    }

    // SMART: Al clickear el audio, extendemos la ventana de WhatsApp automáticamente
    // Esto elimina la necesidad de que el usuario responda "Sí"
    // Click en audio = confirmación implícita de querer briefing mañana
    try {
        const expiresAt = new Date();
        expiresAt.setHours(expiresAt.getHours() + 24);

        await db
            .from("tuqui_morning_users")
            .update({
                whatsapp_status: 'active',
                whatsapp_window_expires_at: expiresAt.toISOString(),
                whatsapp_last_interaction_at: new Date().toISOString()
            })
            .eq("email", output.user_email);

        console.log(`[Audio Link] ✅ Extended WhatsApp window for ${output.user_email} until ${expiresAt.toISOString()}`);
    } catch (error) {
        console.error("[Audio Link] Failed to extend window:", error);
        // Continue anyway - audio should still play
    }

    // Redirect al audio real
    return NextResponse.redirect(output.audio_url);
}

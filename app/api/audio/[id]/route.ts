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

    // Simple redirect al audio real
    // NOTA: El click en este link NO extiende la ventana de WhatsApp
    // Solo el botón de confirmación dentro de WhatsApp extiende la ventana real
    return NextResponse.redirect(output.audio_url);
}

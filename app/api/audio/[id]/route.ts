import { NextResponse } from "next/server";
import { getClient } from "@/lib/supabase/client";

export async function GET(
    request: Request,
    { params }: { params: { id: string } }
) {
    const { id } = params;

    // Buscar el output con este run_id o audio URL
    const db = getClient();
    const { data: output } = await db
        .from("tuqui_morning_outputs")
        .select("audio_url")
        .eq("run_id", id)
        .single();

    if (!output?.audio_url) {
        return new NextResponse("Audio not found", { status: 404 });
    }

    // Redirect al audio real
    return NextResponse.redirect(output.audio_url);
}

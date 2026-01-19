import { NextRequest, NextResponse } from "next/server";
import { getClient } from "@/lib/supabase/client";

export async function GET(req: NextRequest) {
    const { searchParams } = new URL(req.url);
    const email = searchParams.get("email");

    if (!email) return NextResponse.json({ error: "Missing email" }, { status: 400 });

    const db = getClient();
    const { data: user, error } = await db
        .from("tuqui_morning_users")
        .select("profile_analysis_status")
        .eq("email", email)
        .single();

    if (error || !user) {
        return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    return NextResponse.json({ status: user.profile_analysis_status });
}

import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runProfileAnalysis } from "@/lib/intelligence/profile-analyzer";
import { after } from "next/server";

export const maxDuration = 300; 
export const dynamic = 'force-dynamic';

export async function POST(request: Request) {
    const session = await auth();
    const body = await request.json().catch(() => ({}));

    const userEmail = body.userEmail || session?.user?.email;

    if (!userEmail) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    console.log(`🚀 Scheduling profile analysis for ${userEmail}`);
    
    // We return immediately and run the work in the background via after()
    // This avoids the client-side timeout and Vercel's response timeout
    after(async () => {
        try {
            await runProfileAnalysis(userEmail);
            console.log(`✅ Background profile analysis completed for ${userEmail}`);
        } catch (e: any) {
            console.error(`❌ Background profile analysis failed for ${userEmail}:`, e);
        }
    });

    return NextResponse.json({ success: true, message: "Analysis started in background" });
}

export async function GET() {
    const session = await auth();

    if (!session?.user?.email) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    const { getClient } = await import("@/lib/supabase/client");
    const db = getClient();

    const { data: user } = await db
        .from("tuqui_morning_users")
        .select("profile_analysis_status")
        .eq("email", session.user.email)
        .single();

    const { data: profile } = await db
        .from("tuqui_morning_user_profiles")
        .select("*")
        .eq("user_email", session.user.email)
        .single();

    return NextResponse.json({
        status: user?.profile_analysis_status || "pending",
        profile: profile || null,
    });
}

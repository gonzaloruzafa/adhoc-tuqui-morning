import { NextResponse } from "next/server";
import { auth } from "@/auth";
import { runProfileAnalysis } from "@/lib/intelligence/profile-analyzer";

export async function POST(request: Request) {
    const session = await auth();
    const body = await request.json().catch(() => ({}));

    const userEmail = body.userEmail || session?.user?.email;

    if (!userEmail) {
        return new NextResponse("Unauthorized", { status: 401 });
    }

    try {
        // Run analysis asynchronously
        runProfileAnalysis(userEmail)
            .then(() => console.log(`✅ Profile analysis completed for ${userEmail}`))
            .catch(e => console.error(`❌ Profile analysis failed for ${userEmail}:`, e));

        return NextResponse.json({
            success: true,
            message: "Profile analysis started"
        });

    } catch (error) {
        console.error("Failed to start profile analysis:", error);
        return NextResponse.json(
            { error: "Failed to start analysis" },
            { status: 500 }
        );
    }
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

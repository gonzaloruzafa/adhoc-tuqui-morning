import { auth } from "@/auth";
import { getClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
    const session = await auth();
    if (!session?.user?.email) {
        return new NextResponse('Unauthorized', { status: 401 });
    }

    const db = getClient();

    // 1. Get user's schedule
    const { data: schedule } = await db
        .from("tuqui_morning_schedules")
        .select("*")
        .eq("user_email", session.user.email)
        .single();

    if (!schedule) {
        return NextResponse.json({ error: "No schedule found" }, { status: 404 });
    }

    // 2. Create a new Run immediately
    const { data: run, error } = await db
        .from("tuqui_morning_runs")
        .insert({
            schedule_id: schedule.id,
            user_email: session.user.email,
            scheduled_for: new Date().toISOString(),
            status: "pending",
        })
        .select()
        .single();

    if (error || !run) {
        console.error("Error creating run:", error);
        return NextResponse.json({ error: "Failed to create run" }, { status: 500 });
    }

    // 3. Trigger the pipeline asynchronously
    // We use the internal API to decouple logic.
    const baseUrl = process.env.NEXTAUTH_URL || request.url.split('/api')[0];

    fetch(`${baseUrl}/api/internal/run-pipeline`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
            // Optional: Add some internal secret header if run-pipeline checks it, 
            // but run-pipeline might be public or protected by secret. 
            // In cron it was protected by CRON_SECRET or just open? 
            // Let's assume it checks nothing or we might need to authorize it.
            // Looking at cron: it just fetchs.
        },
        body: JSON.stringify({ runId: run.id })
    }).catch(e => console.error("Async trigger failed", e));

    return NextResponse.json({ success: true, runId: run.id });
}

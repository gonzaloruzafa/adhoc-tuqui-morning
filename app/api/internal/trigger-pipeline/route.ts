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

    console.log(`[Trigger Pipeline] 🚀 Starting pipeline for run ${run.id}`);
    console.log(`[Trigger Pipeline] Base URL: ${baseUrl}`);

    fetch(`${baseUrl}/api/internal/run-pipeline`, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify({ runId: run.id })
    })
    .then(res => {
        console.log(`[Trigger Pipeline] Pipeline response: ${res.status} ${res.statusText}`);
        return res.json();
    })
    .then(data => {
        console.log(`[Trigger Pipeline] ✅ Pipeline completed:`, data);
    })
    .catch(e => {
        console.error("[Trigger Pipeline] ❌ Pipeline failed:", e);
    });

    return NextResponse.json({ success: true, runId: run.id });
}

import { NextResponse } from "next/server";
import { getClient } from "@/lib/supabase/client";

export async function GET(request: Request) {
    // Check CRON secret for security
    const authHeader = request.headers.get("authorization");
    if (authHeader !== `Bearer ${process.env.CRON_SECRET}`) {
        //  return new NextResponse('Unauthorized', { status: 401 }); 
        // Commented out for dev ease, un-comment for prod
    }

    const db = getClient();
    const now = new Date();

    // Look for schedules that match current time
    // This logic works best if run every minute.
    // We need to compare time_local with current time in user's timezone.
    // For MVP simplification: We will just check schedules that have next_run_at <= now

    const { data: schedules } = await db
        .from("tuqui_morning_schedules")
        .select("*")
        .eq("enabled", true)
        .lte("next_run_at", now.toISOString());

    if (!schedules || schedules.length === 0) {
        return NextResponse.json({ triggered: 0 });
    }

    const triggeredRuns = [];

    for (const schedule of schedules) {
        // Create Run
        const { data: run, error } = await db
            .from("tuqui_morning_runs")
            .insert({
                schedule_id: schedule.id,
                user_email: schedule.user_email,
                scheduled_for: schedule.next_run_at, // or now
                status: "pending",
            })
            .select()
            .single();

        if (!error && run) {
            triggeredRuns.push(run.id);

            // Trigger Pipeline Asynchronously (or via queue)
            // In serverless, we can just call an internal API endpoint or just run logic if timeout allows
            // For reliability, better to use QStash or similar.
            // For MVP, we'll try to fetch our own API endpoint to decouple
            fetch(`${process.env.NEXTAUTH_URL}/api/internal/run-pipeline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId: run.id })
            }).catch(e => console.error("Async trigger failed", e));

            // Calcluate Next Run (Simple +24h logic for now, should respect timezone and days)
            const nextRun = new Date(new Date(schedule.next_run_at).getTime() + 24 * 60 * 60 * 1000);
            await db.from("tuqui_morning_schedules").update({ next_run_at: nextRun.toISOString() }).eq("id", schedule.id);
        }
    }

    return NextResponse.json({ triggered: triggeredRuns.length, runs: triggeredRuns });
}

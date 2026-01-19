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

            // Trigger Pipeline Asynchronously
            fetch(`${process.env.NEXTAUTH_URL}/api/internal/run-pipeline`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ runId: run.id })
            }).catch(e => console.error("Async trigger failed", e));

            // Calculate Next Run (Respecting days_of_week)
            // Current schedule.next_run_at is the trigger time. 
            // We want the same time but on the next allowed day.
            let nextDate = new Date(new Date(schedule.next_run_at).getTime() + 24 * 60 * 60 * 1000);

            // Loop until we find a day that matches days_of_week
            // 0=Sunday, 1=Monday...
            const allowedDays = schedule.days_of_week || [1, 2, 3, 4, 5];
            while (!allowedDays.includes(nextDate.getDay())) {
                nextDate = new Date(nextDate.getTime() + 24 * 60 * 60 * 1000);
            }

            await db.from("tuqui_morning_schedules").update({
                next_run_at: nextDate.toISOString(),
                updated_at: new Date().toISOString()
            }).eq("id", schedule.id);
        }
    }

    return NextResponse.json({ triggered: triggeredRuns.length, runs: triggeredRuns });
}

import { NextResponse } from "next/server";
import { getClient } from "@/lib/supabase/client";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";

export async function GET() {
    const session = await getServerSession(authOptions);
    if (!session?.user?.email) {
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const db = getClient();
    const userEmail = session.user.email;

    // 1. Get User
    const { data: user } = await db
        .from("tuqui_morning_users")
        .select("*")
        .eq("email", userEmail)
        .single();

    // 2. Get Schedule
    const { data: schedule } = await db
        .from("tuqui_morning_schedules")
        .select("*")
        .eq("user_email", userEmail)
        .maybeSingle();

    // 3. Get Recent Runs
    const { data: recentRuns } = await db
        .from("tuqui_morning_runs")
        .select("*")
        .eq("user_email", userEmail)
        .order("created_at", { ascending: false })
        .limit(5);

    const now = new Date();

    return NextResponse.json({
        user: {
            email: user?.email,
            timezone: user?.timezone,
            whatsapp_status: user?.whatsapp_status,
            whatsapp_window_expires_at: user?.whatsapp_window_expires_at,
            window_is_open: user?.whatsapp_window_expires_at
                ? new Date(user.whatsapp_window_expires_at) > now
                : false,
        },
        schedule: schedule ? {
            id: schedule.id,
            enabled: schedule.enabled,
            time_local: schedule.time_local,
            days_of_week: schedule.days_of_week,
            next_run_at: schedule.next_run_at,
            next_run_at_is_past: schedule.next_run_at ? new Date(schedule.next_run_at) <= now : null,
            timezone: schedule.timezone,
        } : null,
        recentRuns: recentRuns?.map(r => ({
            id: r.id,
            status: r.status,
            scheduled_for: r.scheduled_for,
            created_at: r.created_at,
            started_at: r.started_at,
            finished_at: r.finished_at,
            error_message: r.error_message,
        })),
        server_time: now.toISOString(),
    });
}

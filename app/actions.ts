"use server";

import { auth } from "@/auth";
import { getClient } from "@/lib/supabase/client";
import { revalidatePath } from "next/cache";
import { z } from "zod";

const ConfigSchema = z.object({
    timeLocal: z.string().regex(/^([01]\d|2[0-3]):([0-5]\d)$/, "Invalid time format (HH:MM)"),
    timezone: z.string(),
    phone: z.string().regex(/^\+?[1-9]\d{1,14}$/, "Invalid phone format (E.164)").optional().or(z.literal("")),
});

export async function saveConfiguration(formData: FormData) {
    const session = await auth();
    if (!session?.user?.email) throw new Error("Unauthorized");

    const rawData = {
        timeLocal: formData.get("timeLocal"),
        timezone: formData.get("timezone"),
        phone: formData.get("phone"),
    };

    const validated = ConfigSchema.safeParse(rawData);

    if (!validated.success) {
        return { error: "Invalid data", details: validated.error.flatten() };
    }

    const { timeLocal, timezone, phone } = validated.data;
    const db = getClient();

    // Update User Preference (Phone, Timezone)
    await db
        .from("tuqui_morning_users")
        .update({
            phone_whatsapp: phone || null,
            timezone: timezone
        })
        .eq("email", session.user.email);

    // Update/Create Schedule
    // Note: Using stored procedure or simple upsert logic if schedule ID unknown.
    // Since we link by user_email in our schema:

    const { error } = await db
        .from("tuqui_morning_schedules")
        .upsert({
            user_email: session.user.email,
            time_local: timeLocal,
            enabled: true,
            days_of_week: [1, 2, 3, 4, 5], // Default M-F for now
            updated_at: new Date().toISOString()
        }, { onConflict: 'user_email' });

    if (error) {
        console.error("Schedule save error:", error);
        return { error: "Failed to save schedule" };
    }

    revalidatePath("/");
    return { success: true };
}

export async function getUserConfig() {
    const session = await auth();
    if (!session?.user?.email) return null;

    const db = getClient();

    const { data: user } = await db
        .from("tuqui_morning_users")
        .select("phone_whatsapp, timezone")
        .eq("email", session.user.email)
        .single();

    const { data: schedule } = await db
        .from("tuqui_morning_schedules")
        .select("time_local, enabled")
        .eq("user_email", session.user.email)
        .single();

    return {
        phone: user?.phone_whatsapp || "",
        timezone: user?.timezone || "America/Argentina/Buenos_Aires",
        timeLocal: schedule?.time_local?.slice(0, 5) || "07:00",
        enabled: schedule?.enabled ?? true
    };
}

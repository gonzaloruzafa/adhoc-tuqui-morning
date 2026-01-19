import { auth } from "@/auth";
import { getClient } from "@/lib/supabase/client";
import { OnboardingWizard } from "@/components/onboarding-wizard";
import { redirect } from "next/navigation";

export default async function OnboardingPage() {
    const session = await auth();
    if (!session?.user?.email) redirect("/login");

    const db = getClient();
    const { data: user } = await db
        .from("tuqui_morning_users")
        .select("*")
        .eq("email", session.user.email)
        .single();

    if (!user) redirect("/login");

    // If already finished, back to home
    if (user.onboarding_completed) redirect("/");

    return (
        <div className="min-h-screen bg-white">
            <OnboardingWizard
                userEmail={user.email}
                initialStatus={user.profile_analysis_status}
                initialTime="07:00"
                initialPhone={user.phone_whatsapp || ""}
                initialTimezone={user.timezone || "America/Argentina/Buenos_Aires"}
            />
        </div>
    );
}

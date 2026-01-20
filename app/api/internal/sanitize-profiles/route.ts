import { getClient } from "@/lib/supabase/client";
import { NextResponse } from "next/server";

/**
 * One-time endpoint to sanitize existing profiles with string "null" values
 * Call this once after deploying the fix, then delete it
 * GET /api/internal/sanitize-profiles
 */
export async function GET() {
    const db = getClient();

    // Fetch all profiles
    const { data: profiles, error } = await db
        .from("tuqui_morning_user_profiles")
        .select("*");

    if (error || !profiles) {
        return NextResponse.json({ error: "Failed to fetch profiles" }, { status: 500 });
    }

    const sanitized = [];

    for (const profile of profiles) {
        let needsUpdate = false;
        const updates: any = {};

        // Check each field for string "null"
        const fieldsToCheck = [
            'inferred_role', 'inferred_title', 'inferred_company', 'inferred_industry',
            'inferred_seniority', 'company_size_hint', 'inferred_tone',
            'communication_style', 'preferred_greeting', 'personality_hints',
            'current_focus', 'stress_level', 'persona_description', 'one_liner'
        ];

        fieldsToCheck.forEach(field => {
            if (profile[field] === 'null' || profile[field] === 'NULL') {
                updates[field] = null;
                needsUpdate = true;
            }
        });

        // Check array fields
        const arrayFields = ['recurring_topics', 'active_projects', 'stress_reasons', 'vip_domains', 'personal_interests'];
        arrayFields.forEach(field => {
            if (profile[field] && Array.isArray(profile[field])) {
                const cleaned = profile[field].filter((item: any) => item !== 'null' && item !== 'NULL');
                if (cleaned.length !== profile[field].length) {
                    updates[field] = cleaned.length > 0 ? cleaned : null;
                    needsUpdate = true;
                }
            }
        });

        if (needsUpdate) {
            const { error: updateError } = await db
                .from("tuqui_morning_user_profiles")
                .update({
                    ...updates,
                    updated_at: new Date().toISOString()
                })
                .eq("user_email", profile.user_email);

            if (updateError) {
                console.error(`Failed to sanitize profile for ${profile.user_email}:`, updateError);
            } else {
                sanitized.push(profile.user_email);
            }
        }
    }

    return NextResponse.json({
        success: true,
        message: `Sanitized ${sanitized.length} profiles`,
        sanitized_emails: sanitized
    });
}

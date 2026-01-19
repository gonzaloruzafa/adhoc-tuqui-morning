import { GoogleGenerativeAI } from "@google/generative-ai";
import { EmailSummary } from "@/lib/google/gmail";
import { getClient } from "@/lib/supabase/client";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface UserProfile {
    inferred_role: string | null;
    inferred_company: string | null;
    inferred_industry: string | null;
    inferred_seniority: "executive" | "manager" | "individual_contributor" | null;
    inferred_tone: "formal" | "casual" | "mixed";
    recurring_topics: string[];
    current_focus: string | null;
    stress_level: "low" | "medium" | "high";
    vip_contacts: VIPContact[];
    vip_domains: string[];
    personality_hints: string | null;
    preferred_greeting: string | null;
    persona_description?: string | null;
}

export interface VIPContact {
    email: string;
    name: string;
    relationship: string;
    frequency: number;
}

export function generateProfileAnalysisPrompt(
    emails: EmailSummary[],
    userName: string
): string {
    const senderFrequency: Record<string, { name: string; count: number }> = {};

    emails.forEach(email => {
        const key = email.fromEmail.toLowerCase();
        if (!senderFrequency[key]) {
            senderFrequency[key] = { name: email.from, count: 0 };
        }
        senderFrequency[key].count++;
    });

    const topSenders = Object.entries(senderFrequency)
        .sort((a, b) => b[1].count - a[1].count)
        .slice(0, 20)
        .map(([email, data]) => `${data.name} <${email}> (${data.count} emails)`)
        .join('\n');

    const emailsSummary = emails.slice(0, 200).map(e =>
        `De: ${e.from} <${e.fromEmail}> | Asunto: ${e.subject} | Fecha: ${e.date.toISOString().split('T')[0]}`
    ).join('\n');

    return `
Analizá los emails de ${userName} para crear su perfil profesional.
REGLAS CRÍTICAS:
1. Basate SOLO en la evidencia de los emails provistos.
2. Si no encontrás evidencia para un campo, usá el valor null (tipo null de JSON), NUNCA la palabra "null" como texto.
3. El seniority debe ser obligatoriamente uno de estos: "executive", "manager", "individual_contributor" o null.

CONTACTOS MÁS FRECUENTES:
${topSenders}

EMAILS RECIENTES (últimos ${emails.length}):
${emailsSummary}

Respondé SOLO con JSON válido (sin markdown, sin explicaciones, sin bloques de código):

{
  "inferred_role": "CEO, Founder, Product Manager, etc. (o null)",
  "inferred_company": "Nombre de la empresa (o null)",
  "inferred_industry": "Industria (o null)",
  "inferred_seniority": "executive" | "manager" | "individual_contributor" | null,
  "inferred_tone": "formal" | "casual" | "mixed",
  "recurring_topics": ["máximo 5 temas principales"],
  "current_focus": "foco actual en 1 frase (o null)",
  "stress_level": "low" | "medium" | "high",
  "vip_contacts": [
    {
      "email": "email@ejemplo.com",
      "name": "Nombre",
      "relationship": "inversor" | "cliente" | "socio" | "jefe" | "colega" | "proveedor",
      "frequency": número_de_emails
    }
  ],
  "vip_domains": ["ej. adhoc.com.ar"],
  "personality_hints": "estilo de comunicación (1 frase)",
  "preferred_greeting": "apodo o nombre corto que prefiere",
  "persona_description": "una breve bio de 2-3 frases resumiendo quién es esta persona profesionalmente y su rol actual"
}
`;
}

export async function analyzeUserProfile(
    emails: EmailSummary[],
    userName: string
): Promise<UserProfile> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const prompt = generateProfileAnalysisPrompt(emails, userName);

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.3,
            maxOutputTokens: 2000,
        },
    });

    const responseText = result.response.text();
    const jsonText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    try {
        return JSON.parse(jsonText);
    } catch (e) {
        console.error("Failed to parse profile JSON:", jsonText);
        throw new Error("Profile analysis returned invalid JSON");
    }
}

export async function runProfileAnalysis(userEmail: string): Promise<void> {
    console.log(`[ProfileAnalyzer] Starting analysis for ${userEmail}`);
    const db = getClient();
    await db.from("tuqui_morning_users").update({
        profile_analysis_status: "analyzing",
        profile_analysis_count: 0,
        profile_analysis_total: 0
    }).eq("email", userEmail);

    try {
        const { data: user } = await db.from("tuqui_morning_users").select("name").eq("email", userEmail).single();
        const { getValidAccessToken } = await import("@/lib/google/auth");
        const accessToken = await getValidAccessToken(userEmail);

        const { fetchRecentEmails } = await import("@/lib/google/gmail");
        console.log(`[ProfileAnalyzer] Fetching emails...`);
        const emails = await fetchRecentEmails(accessToken, {
            maxResults: 100, // Optimized for reliability
            q: "", // Use the fix in gmail.ts to get all mail
            onProgress: async (count, total) => {
                console.log(`[ProfileAnalyzer] Progress: ${count}/${total}`);
                await db.from("tuqui_morning_users").update({
                    profile_analysis_count: count,
                    profile_analysis_total: total
                }).eq("email", userEmail);
            }
        });

        console.log(`[ProfileAnalyzer] Found ${emails.length} emails. Analyzing...`);
        if (emails.length < 5) {
            console.warn(`[ProfileAnalyzer] Not enough emails (${emails.length})`);
            throw new Error("Not enough emails for analysis");
        }

        const profile = await analyzeUserProfile(emails, user?.name || "Usuario");
        console.log(`[ProfileAnalyzer] Analysis complete. Saving...`);

        await db.from("tuqui_morning_user_profiles").upsert({
            user_email: userEmail,
            ...profile,
            emails_analyzed: emails.length,
            last_analysis_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
        }, { onConflict: "user_email" });

        await db.from("tuqui_morning_users").update({
            profile_analysis_status: "completed",
            onboarding_completed: true
        }).eq("email", userEmail);

        console.log(`[ProfileAnalyzer] Done. Revalidating paths.`);
        revalidatePath("/profile");
        revalidatePath("/");

    } catch (error) {
        console.error("[ProfileAnalyzer] Profile analysis failed:", error);
        await db.from("tuqui_morning_users").update({ profile_analysis_status: "failed" }).eq("email", userEmail);
        revalidatePath("/profile");
        throw error;
    }
}

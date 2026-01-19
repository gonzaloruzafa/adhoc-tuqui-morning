import { GoogleGenerativeAI } from "@google/generative-ai";
import { EmailSummary } from "@/lib/google/gmail";
import { getClient } from "@/lib/supabase/client";

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
IMPORTANTE: Solo inferí de la EVIDENCIA. No inventes datos.

CONTACTOS MÁS FRECUENTES:
${topSenders}

EMAILS RECIENTES (últimos ${emails.length}):
${emailsSummary}

Respondé SOLO con JSON válido (sin markdown, sin explicaciones):

{
  "inferred_role": "rol más probable basado en evidencia (CEO, Founder, Manager, Developer, etc.) o null si no hay evidencia",
  "inferred_company": "empresa/organización donde trabaja o null",
  "inferred_industry": "industria principal (Software, E-commerce, Fintech, etc.) o null",
  "inferred_seniority": "executive" | "manager" | "individual_contributor" | null,
  "inferred_tone": "formal" | "casual" | "mixed",
  "recurring_topics": ["máximo 5 temas que aparecen frecuentemente en los asuntos"],
  "current_focus": "en qué parece estar enfocado esta semana (1 frase corta) o null",
  "stress_level": "low" | "medium" | "high",
  "vip_contacts": [
    {
      "email": "email@ejemplo.com",
      "name": "Nombre",
      "relationship": "inversor" | "cliente" | "socio" | "jefe" | "colega" | "proveedor",
      "frequency": número_de_emails
    }
  ],
  "vip_domains": ["dominios importantes como empresa.com, cliente.com (ej: adhoc.com.ar)"],
  "personality_hints": "cómo prefiere comunicarse esta persona (1 frase)",
  "preferred_greeting": "nombre corto o apodo inferido del tono de los emails"
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
    const db = getClient();
    await db.from("tuqui_morning_users").update({ profile_analysis_status: "analyzing" }).eq("email", userEmail);

    try {
        const { data: user } = await db.from("tuqui_morning_users").select("name").eq("email", userEmail).single();
        const { getValidAccessToken } = await import("@/lib/google/auth");
        const accessToken = await getValidAccessToken(userEmail);

        const { fetchRecentEmails } = await import("@/lib/google/gmail");
        const emails = await fetchRecentEmails(accessToken, { maxResults: 300, hoursBack: 24 * 30 });

        if (emails.length < 5) throw new Error("Not enough emails for analysis");

        const profile = await analyzeUserProfile(emails, user?.name || "Usuario");
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

    } catch (error) {
        console.error("Profile analysis failed:", error);
        await db.from("tuqui_morning_users").update({ profile_analysis_status: "failed" }).eq("email", userEmail);
        throw error;
    }
}

import { GoogleGenerativeAI } from "@google/generative-ai";
import { EmailForProfile } from "@/lib/google/gmail";
import { getClient } from "@/lib/supabase/client";
import { revalidatePath } from "next/cache";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface UserProfile {
    // Identidad profesional
    inferred_role: string | null;
    inferred_title: string | null;
    inferred_company: string | null;
    inferred_industry: string | null;
    inferred_seniority: "founder" | "c-level" | "executive" | "manager" | "individual_contributor" | null;
    is_founder: boolean;
    company_size_hint: "startup" | "small" | "medium" | "enterprise" | null;

    // Personalidad y comunicación
    inferred_tone: "formal" | "casual" | "mixed";
    communication_style: string | null;
    preferred_greeting: string | null;
    personality_hints: string | null;

    // Contexto actual
    recurring_topics: string[];
    current_focus: string | null;
    active_projects: string[];
    stress_level: "low" | "medium" | "high";
    stress_reasons: string[];

    // Relaciones
    vip_contacts: VIPContact[];
    vip_domains: string[];
    team_size_hint: number | null;

    // Bio generada
    persona_description: string | null;
    one_liner: string | null;

    // Meta
    confidence_score: number;

    // Intereses (NUEVO)
    personal_interests: string[] | null;
}

export interface VIPContact {
    email: string;
    name: string;
    relationship: "investor" | "client" | "partner" | "boss" | "direct_report" | "peer" | "vendor" | "other" | "colega" | "socio" | "inversor" | "cliente" | "jefe" | "proveedor";
    frequency: number;
    importance: "critical" | "high" | "medium" | "low";
    context: string | null;
}

export function generateProfileAnalysisPrompt(
    emails: EmailForProfile[],
    userName: string,
    userEmail: string
): string {
    // Separar enviados y recibidos
    const sent = emails.filter(e => e.direction === 'sent');
    const received = emails.filter(e => e.direction === 'received');

    // Analizar patrones de comunicación
    const senderFrequency: Record<string, { name: string; sent: number; received: number }> = {};

    emails.forEach(email => {
        if (email.direction === 'received') {
            const key = email.fromEmail.toLowerCase();
            if (!senderFrequency[key]) {
                senderFrequency[key] = { name: email.from, sent: 0, received: 0 };
            }
            senderFrequency[key].received++;
        } else {
            email.toEmails.forEach(toEmail => {
                const key = toEmail.toLowerCase();
                if (!senderFrequency[key]) {
                    senderFrequency[key] = { name: toEmail, sent: 0, received: 0 };
                }
                senderFrequency[key].sent++;
            });
        }
    });

    // Top contactos con contexto de dirección
    const topContacts = Object.entries(senderFrequency)
        .filter(([email]) => !email.includes('noreply') && !email.includes('notification'))
        .sort((a, b) => (b[1].sent + b[1].received) - (a[1].sent + a[1].received))
        .slice(0, 30)
        .map(([email, data]) =>
            `${data.name} <${email}> - Le escribió ${data.sent}x, Recibió ${data.received}x`
        )
        .join('\n');

    // Muestra de emails ENVIADOS (clave para detectar liderazgo)
    const sentSample = sent.slice(0, 50).map(e =>
        `[ENVIADO ${e.date.toISOString().split('T')[0]}] Para: ${e.to.join(', ')} | Asunto: ${e.subject} | Preview: ${e.bodyPreview.substring(0, 200)}`
    ).join('\n\n');

    // Muestra de emails RECIBIDOS
    const receivedSample = received.slice(0, 50).map(e =>
        `[RECIBIDO ${e.date.toISOString().split('T')[0]}] De: ${e.from} <${e.fromEmail}> | Asunto: ${e.subject} | Preview: ${e.bodyPreview.substring(0, 200)}`
    ).join('\n\n');

    // Subjects únicos para detectar temas
    const allSubjects = [...new Set(emails.map(e => e.subject))].slice(0, 100).join('\n');

    return `
Sos un analista experto en perfiles profesionales. Tu tarea es crear un perfil PRECISO de ${userName} (${userEmail}) basándote ÚNICAMENTE en la evidencia de sus emails.

═══════════════════════════════════════════════════════════════
ESTADÍSTICAS DE COMUNICACIÓN
═══════════════════════════════════════════════════════════════
- Total emails analizados: ${emails.length}
- Emails ENVIADOS por ${userName}: ${sent.length}
- Emails RECIBIDOS por ${userName}: ${received.length}
- Ratio envío/recepción: ${(sent.length / Math.max(received.length, 1)).toFixed(2)}

═══════════════════════════════════════════════════════════════
TOP CONTACTOS (con dirección de comunicación)
═══════════════════════════════════════════════════════════════
${topContacts}

═══════════════════════════════════════════════════════════════
EMAILS ENVIADOS POR ${userName.toUpperCase()} (muestra de ${Math.min(50, sent.length)})
═══════════════════════════════════════════════════════════════
IMPORTANTE: Estos emails muestran cómo ${userName} se comunica, qué decide, qué delega, a quién lidera.

${sentSample || "No hay emails enviados disponibles"}

═══════════════════════════════════════════════════════════════
EMAILS RECIBIDOS POR ${userName.toUpperCase()} (muestra de ${Math.min(50, received.length)})
═══════════════════════════════════════════════════════════════
${receivedSample || "No hay emails recibidos disponibles"}

═══════════════════════════════════════════════════════════════
TODOS LOS ASUNTOS (para detectar temas recurrentes)
═══════════════════════════════════════════════════════════════
${allSubjects}

═══════════════════════════════════════════════════════════════
INSTRUCCIONES DE ANÁLISIS
═══════════════════════════════════════════════════════════════

1. DETECTAR ROL Y SENIORITY:
   - ¿Da órdenes o las recibe?
   - ¿Aprueba cosas o pide aprobación?
   - ¿Le reportan a él o él reporta?
   - ¿Menciona "mi empresa", "fundé", "creamos"?
   - ¿Toma decisiones estratégicas o ejecuta tareas?

2. DETECTAR SI ES FUNDADOR/DUEÑO:
   - Buscar señales: "mi empresa", "fundamos", decisiones de alto nivel
   - Si aprueba gastos grandes, contrata, decide estrategia → probablemente fundador/C-level
   - Si ejecuta tareas asignadas → probablemente no es el dueño

3. CLASIFICAR CONTACTOS:
   - investor: VCs, angels, fondos (buscar: "inversión", "funding", "term sheet")
   - client: clientes que pagan (buscar: facturas, proyectos, implementaciones)
   - direct_report: gente que le reporta (él les asigna tareas, les da feedback)
   - boss: alguien a quien él reporta (si existe)
   - partner: socios de negocio
   - vendor: proveedores

4. DETECTAR PROYECTOS ACTIVOS Y GUSTOS:
   - ¿Qué está construyendo? ¿Qué iniciativas lidera?
   - ¿Hay nombres de productos/proyectos mencionados?
   - ¿Detectás algún interés, hobby o gusto personal fuera del trabajo para dar "color" al perfil?

5. INFERIR ESTRÉS Y CAUSAS:
   - Alto volumen de emails urgentes → alto estrés
   - Muchos threads abiertos sin resolver → alto estrés
   - Buscar palabras: "urgente", "deadline", "ASAP", "problema"

═══════════════════════════════════════════════════════════════
OUTPUT REQUERIDO (JSON válido, sin markdown)
═══════════════════════════════════════════════════════════════

{
  "inferred_role": "título específico (CEO, CTO, Founder, Product Manager, etc.) o null",
  "inferred_title": "título formal si se detecta o null",
  "inferred_company": "nombre de la empresa o null",
  "inferred_industry": "industria específica o null",
  "inferred_seniority": "founder" | "c-level" | "executive" | "manager" | "individual_contributor" | null,
  "is_founder": true | false,
  "company_size_hint": "startup" | "small" | "medium" | "enterprise" | null,
  
  "inferred_tone": "formal" | "casual" | "mixed",
  "communication_style": "descripción breve del estilo (ej: 'directo y conciso', 'detallista')",
  "preferred_greeting": "nombre o apodo que prefiere",
  "personality_hints": "cómo es mejor comunicarse con esta persona",
  
  "recurring_topics": ["máximo 7 temas principales detectados"],
  "current_focus": "en qué está enfocado ESTA semana (1-2 frases)",
  "active_projects": ["proyectos/iniciativas que lidera actualmente"],
  "stress_level": "low" | "medium" | "high",
  "stress_reasons": ["razones específicas del nivel de estrés"],
  "personal_interests": ["hobbies, gustos o temas de interés personal detectados"],
  
  "vip_contacts": [
    {
      "email": "email@ejemplo.com",
      "name": "Nombre Completo",
      "relationship": "investor" | "client" | "partner" | "boss" | "direct_report" | "peer" | "vendor" | "other",
      "frequency": número_total_de_interacciones,
      "importance": "critical" | "high" | "medium" | "low",
      "context": "contexto breve de la relación (ej: 'Lead investor', 'Cliente principal')"
    }
  ],
  "vip_domains": ["dominios importantes excluyendo gmail, outlook, etc"],
  "team_size_hint": número_estimado_de_reportes_directos_o_null,
  
  "persona_description": "Bio profesional de 3-4 frases que capture quién es esta persona, qué hace, qué le importa. Debe sonar como si alguien que lo conoce lo describiera.",
  "one_liner": "Descripción en UNA sola línea (ej: 'CEO de Adhoc, construyendo productos de IA para enterprise')",
  
  "confidence_score": número_0_a_100
}

REGLAS CRÍTICAS:
- Si no hay evidencia suficiente, usa null (el valor JSON null, NUNCA el string "null")
- IMPORTANTE: null debe ser el literal JSON null, NO la palabra "null" entre comillas
- Los vip_contacts deben tener máximo 15 personas, ordenados por importancia
- El persona_description debe ser ESPECÍFICO, no genérico
- El one_liner debe ser memorable y preciso
- Si detectas que es fundador/CEO, el tono del persona_description debe reflejarlo
- Arrays vacíos deben ser [] y no null

Solo responde con el JSON, sin explicaciones ni markdown.
`;
}

export async function analyzeUserProfile(
    emails: EmailForProfile[],
    userName: string,
    userEmail: string
): Promise<UserProfile> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });
    const prompt = generateProfileAnalysisPrompt(emails, userName, userEmail);

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.2,  // Más bajo para consistencia
            maxOutputTokens: 2000,
        },
    });

    const responseText = result.response.text();
    const jsonText = responseText.replace(/```json\s*/g, '').replace(/```\s*/g, '').trim();

    try {
        const profile = JSON.parse(jsonText);

        // Sanitizar strings "null" a null real
        const sanitizeNull = (val: any) => (val === 'null' || val === null || val === undefined) ? null : val;

        Object.keys(profile).forEach(key => {
            if (typeof profile[key] === 'string' && profile[key] === 'null') {
                profile[key] = null;
            }
        });

        // Validar campos requeridos
        if (!profile.persona_description || profile.persona_description === 'null') {
            profile.persona_description = `${userName} trabaja en ${sanitizeNull(profile.inferred_company) || 'una empresa'}. Basado en sus comunicaciones, parece enfocado en ${sanitizeNull(profile.current_focus) || 'sus responsabilidades diarias'}.`;
        }

        if (!profile.one_liner || profile.one_liner === 'null') {
            profile.one_liner = `${sanitizeNull(profile.inferred_role) || 'Profesional'} en ${sanitizeNull(profile.inferred_company) || 'su empresa'}`;
        }

        return profile;
    } catch (e) {
        console.error("Failed to parse profile JSON:", jsonText);
        throw new Error("Profile analysis returned invalid JSON");
    }
}

export async function runProfileAnalysis(userEmail: string): Promise<void> {
    console.log(`[ProfileAnalyzer] Starting ENHANCED analysis for ${userEmail}`);
    const db = getClient();

    await db.from("tuqui_morning_users").update({
        profile_analysis_status: "analyzing",
        profile_analysis_count: 0,
        profile_analysis_total: 0
    }).eq("email", userEmail);

    try {
        const { data: user } = await db
            .from("tuqui_morning_users")
            .select("name")
            .eq("email", userEmail)
            .single();

        const { getValidAccessToken } = await import("@/lib/google/auth");
        const accessToken = await getValidAccessToken(userEmail);

        // USAR LA NUEVA FUNCIÓN
        const { fetchEmailsForProfile } = await import("@/lib/google/gmail");
        console.log(`[ProfileAnalyzer] Fetching emails with ENHANCED method...`);

        const emails = await fetchEmailsForProfile(accessToken, {
            maxResults: 500,    // MÁS EMAILS
            daysBack: 60,       // 2 MESES
            onProgress: async (count, total) => {
                console.log(`[ProfileAnalyzer] Progress: ${count}/${total}`);

                const { data: currentUser } = await db
                    .from("tuqui_morning_users")
                    .select("profile_analysis_status")
                    .eq("email", userEmail)
                    .single();

                if (currentUser?.profile_analysis_status !== 'analyzing') {
                    throw new Error("Analysis canceled by user");
                }

                await db.from("tuqui_morning_users").update({
                    profile_analysis_count: count,
                    profile_analysis_total: total
                }).eq("email", userEmail);
            }
        });

        console.log(`[ProfileAnalyzer] Found ${emails.length} emails. Analyzing...`);

        if (emails.length < 10) {
            console.warn(`[ProfileAnalyzer] Not enough emails (${emails.length})`);
            throw new Error("Not enough emails for meaningful analysis. Need at least 10.");
        }

        // USAR EL NUEVO ANALYZER
        const profile = await analyzeUserProfile(
            emails,
            user?.name || "Usuario",
            userEmail
        );

        console.log(`[ProfileAnalyzer] Analysis complete. Confidence: ${profile.confidence_score}%`);

        // Guardar con nuevos campos
        await db.from("tuqui_morning_user_profiles").upsert({
            user_email: userEmail,
            inferred_role: profile.inferred_role,
            inferred_company: profile.inferred_company,
            inferred_industry: profile.inferred_industry,
            inferred_seniority: profile.inferred_seniority,
            inferred_tone: profile.inferred_tone,
            recurring_topics: profile.recurring_topics,
            current_focus: profile.current_focus,
            stress_level: profile.stress_level,
            vip_contacts: profile.vip_contacts,
            vip_domains: profile.vip_domains,
            personality_hints: profile.personality_hints,
            preferred_greeting: profile.preferred_greeting,
            persona_description: profile.persona_description,
            // Nuevos campos
            is_founder: profile.is_founder,
            one_liner: profile.one_liner,
            active_projects: profile.active_projects,
            confidence_score: profile.confidence_score,
            communication_style: profile.communication_style,
            stress_reasons: profile.stress_reasons,
            team_size_hint: profile.team_size_hint,
            personal_interests: profile.personal_interests,
            // Meta
            emails_analyzed: emails.length,
            emails_sent_analyzed: emails.filter(e => e.direction === 'sent').length,
            emails_received_analyzed: emails.filter(e => e.direction === 'received').length,
            last_analysis_at: new Date().toISOString(),
            analysis_version: 3,  // Versión del algoritmo
            updated_at: new Date().toISOString(),
        }, { onConflict: "user_email" });

        await db.from("tuqui_morning_users").update({
            profile_analysis_status: "completed",
            onboarding_completed: true
        }).eq("email", userEmail);

        console.log(`[ProfileAnalyzer] Done. Profile saved.`);
        revalidatePath("/profile");
        revalidatePath("/");

    } catch (error: any) {
        if (error.message === "Analysis canceled by user") {
            return;
        }
        console.error("[ProfileAnalyzer] Failed:", error);
        await db.from("tuqui_morning_users").update({
            profile_analysis_status: "failed"
        }).eq("email", userEmail);
        revalidatePath("/profile");
        throw error;
    }
}

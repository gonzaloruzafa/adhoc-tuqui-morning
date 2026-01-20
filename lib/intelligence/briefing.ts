import { GoogleGenerativeAI } from "@google/generative-ai";
import { UserProfile } from "./profile-analyzer";
import { NewsItem } from "./news";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export interface EssentialEvent {
    title: string;
    startTime: Date;
    priority?: "high" | "medium" | "low";
}

export interface EssentialEmail {
    email: {
        from: string;
        fromEmail: string;
        subject: string;
    };
    isVIP?: boolean;
}

interface BriefingInput {
    userName: string;
    date: Date;
    timezone: string;
    events: EssentialEvent[];
    emails: EssentialEmail[];
    news?: NewsItem[];
    profile?: UserProfile | null;
}

const CLOSING_PHRASES = {
    monday: [
        "Arrancamos la semana. Dale con todo.",
        "Lunes, día de empezar fuerte. Vos podés.",
        "Nueva semana, nuevas oportunidades. A por ellas.",
    ],
    friday: [
        "Viernes, último empujón de la semana.",
        "Ya casi terminamos la semana. Un esfuerzo más.",
        "Viernes, cerrá la semana con todo.",
    ],
    general: [
        "Dale para adelante.",
        "Buen día, hacelo tuyo.",
        "Arrancá con todo.",
        "Éxitos hoy.",
    ],
    random_facts: [
        "Dato random: el primer email se envió en 1971. Ahora te estoy resumiendo los tuyos.",
        "Dato del día: tu cerebro procesa 70,000 pensamientos por día. Este audio te ahorra unos cuantos.",
        "Fun fact: hoy es un gran día para ser extraordinario.",
        "Dato curioso: el café tarda 20 minutos en hacer efecto, así que estamos a tiempo.",
        "Sabías que: el día de hoy tiene las mismas 24hs que ayer, pero hoy vas a lograr más.",
    ],
};

function selectClosingPhrase(date: Date, profile?: UserProfile | null): string {
    const dayOfWeek = date.getDay();

    if (dayOfWeek === 1) return CLOSING_PHRASES.monday[Math.floor(Math.random() * CLOSING_PHRASES.monday.length)];
    if (dayOfWeek === 5) return CLOSING_PHRASES.friday[Math.floor(Math.random() * CLOSING_PHRASES.friday.length)];

    if (Math.random() < 0.4) {
        return CLOSING_PHRASES.random_facts[Math.floor(Math.random() * CLOSING_PHRASES.random_facts.length)];
    }

    return CLOSING_PHRASES.general[Math.floor(Math.random() * CLOSING_PHRASES.general.length)];
}

export function generateBriefingPrompt(input: BriefingInput): string {
    const { userName, date, timezone, events, emails, news, profile } = input;

    const dateStr = date.toLocaleDateString("es-AR", {
        weekday: "long",
        day: "numeric",
        month: "long",
        timeZone: timezone,
    });

    const eventsSection = events.slice(0, 5).map((e) => {
        const time = e.startTime.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: timezone,
        });
        const priority = e.priority === "high" ? " [IMPORTANTE]" : "";
        return `- ${time}: ${e.title}${priority}`;
    }).join("\n");

    const emailsSection = emails.slice(0, 5).map((e) => {
        const vipMark = e.isVIP ? " [VIP]" : "";
        return `- De: ${e.email.from}${vipMark} | Asunto: ${e.email.subject}`;
    }).join("\n");

    const newsSection = news && news.length > 0 ? `
NOTICIAS RELEVANTES:
${news.map(n => `- ${n.title}: ${n.content.slice(0, 100)}...`).join("\n")}
` : "";

    const profileSection = profile ? `
PERFIL DEL USUARIO (usalo para personalizar):
- Rol: ${profile.inferred_role || "No determinado"}
- Empresa: ${profile.inferred_company || "No determinada"}
- Temas que le importan: ${profile.recurring_topics?.join(", ") || "Varios"}
- Foco actual: ${profile.current_focus || "No determinado"}
- Tono preferido: ${profile.inferred_tone || "casual"}
- Nombre a usar: ${profile.preferred_greeting || userName.split(" ")[0]}
- Gustos e intereses personales: ${profile.personal_interests?.join(", ") || "No detectados"}
` : "";

    const closingPhrase = selectClosingPhrase(date, profile);

    return `
Sos el asistente personal de ${userName}. Generá un briefing matutino en AUDIO.

${profileSection}

FECHA: Hoy es ${dateStr}

REUNIONES DE HOY:
${eventsSection || "No hay reuniones programadas para hoy."}

EMAILS IMPORTANTES (últimas 24h):
${emailsSection || "No hay emails urgentes."}

${newsSection}

CIERRE SUGERIDO:
"${closingPhrase}"

═══════════════════════════════════════════════
INSTRUCCIONES PARA EL SCRIPT DE AUDIO:
═══════════════════════════════════════════════

1. SALUDO: Cálido y personalizado, usando el apodo o nombre preferido.
2. AGENDA: Máximo 3-4 reuniones. Si es el primer briefing del día (o bienvenida), mencionalo.
3. EMAILS: Resaltá si hay de VIPs o temas que le importan según su perfil.
4. NOTICIAS: Incluí brevemente si hay algo interesante de las noticias relevantes.
5. CONTENIDO SORPRESA: Si detectaste gustos/intereses personales, agregá AL FINAL un dato, noticia breve o curiosidad relacionada con esos temas. Debe ser inesperado y entretenido, tipo "máquina de casino": no sabe qué le va a tocar, pero es algo interesante afín a sus gustos. Ejemplo: si le gusta el fútbol, un dato rápido sobre su equipo; si le interesa la tecnología, una novedad tech; si es runner, un tip de entrenamiento. Máximo 1-2 frases.
6. CIERRE: Usá el cierre sugerido o adaptalo.
7. TONO: Español argentino (vos, che, etc.). Conversacional, rápido y cálido. Hacelo sonar humano y cercano.
8. FORMATO: Sin bullets. Texto plano para ser HABLADO. Máximo 180 palabras (incluido el contenido sorpresa).

Generá el script ahora:
`;
}

export async function generateBriefingScript(
    prompt: string
): Promise<{ script: string; tokensUsed: number }> {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" });

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
        },
    });

    const script = result.response.text();
    const tokensUsed = result.response.usageMetadata?.totalTokenCount || 0;

    const cleanScript = script
        .replace(/\*\*/g, "")
        .replace(/\*/g, "")
        .replace(/^[-•]\s*/gm, "")
        .trim();

    return { script: cleanScript, tokensUsed };
}

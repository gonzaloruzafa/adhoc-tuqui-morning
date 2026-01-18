import { GoogleGenerativeAI } from "@google/generative-ai";
import { EmailSummary } from "@/lib/google/gmail";
// Fix: Import types from heuristics return or define locally if complex
// Reusing heuristics output structure
interface EssentialEvent {
    event: {
        title: string;
        startTime: Date;
    };
    priority: string;
}
interface EssentialEmail {
    email: {
        from: string;
        subject: string;
    }
}

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!);

export function generateBriefingPrompt(input: {
    userName: string;
    date: Date;
    timezone: string;
    events: EssentialEvent[];
    emails: EssentialEmail[];
}): string {
    const { userName, date, timezone, events, emails } = input;

    const dateStr = date.toLocaleDateString("es-AR", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
        timeZone: timezone,
    });

    const eventsSection = events.slice(0, 5).map((e) => {
        const time = e.event.startTime.toLocaleTimeString("es-AR", {
            hour: "2-digit",
            minute: "2-digit",
            timeZone: timezone,
        });
        return `- ${time}: ${e.event.title} (${e.priority})`;
    }).join("\n");

    const emailsSection = emails.slice(0, 5).map((e) => {
        return `- De: ${e.email.from} | Asunto: ${e.email.subject}`;
    }).join("\n");

    return `
Sos un asistente personal que prepara un briefing matutino para ${userName}.
Generá un SCRIPT DE AUDIO de 60-90 segundos (máx 150 palabras).

FECHA: ${dateStr}

REUNIONES DE HOY:
${eventsSection || "No hay reuniones programadas."}

EMAILS IMPORTANTES:
${emailsSection || "No hay emails destacados."}

INSTRUCCIONES:
1. Tono NATURAL y CONVERSACIONAL (será hablado)
2. Saludo breve con nombre y fecha
3. Máximo 3-4 reuniones, 2-3 emails
4. Resaltá lo urgente
5. Cierre positivo y breve
6. Español argentino (vos, conjugaciones argentinas)
7. NO uses bullets - es para ser HABLADO
8. NO saludes con "Hola soy tu asistente", andá directo al grano: "Buen día Gonza, hoy tenés..."

Generá el script ahora:
`;
}

export async function generateBriefingScript(prompt: string) {
    const model = genAI.getGenerativeModel({ model: "gemini-2.0-flash-exp" }); // Using faster flash model

    const result = await model.generateContent({
        contents: [{ role: "user", parts: [{ text: prompt }] }],
        generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 600,
        },
    });

    return {
        script: result.response.text(),
        tokensUsed: result.response.usageMetadata?.totalTokenCount || 0,
    };
}

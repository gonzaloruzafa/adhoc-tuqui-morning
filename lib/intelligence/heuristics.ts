import { EmailSummary } from "./google/gmail";
import { CalendarEvent } from "./google/calendar";

// ===========================================
// EMAIL HEURISTICS
// ===========================================

const URGENCY_KEYWORDS = [
    "urgent", "urgente", "asap", "immediate", "today", "hoy",
    "deadline", "vence", "overdue", "vencido", "important", "importante",
    "action required", "acción requerida", "reminder", "recordatorio",
];

const BUSINESS_KEYWORDS = [
    "invoice", "factura", "payment", "pago", "contract", "contrato",
    "proposal", "propuesta", "meeting", "reunión", "call", "llamada",
];

export function scoreEmailImportance(
    email: EmailSummary,
    userDomain: string,
    vipList: string[] = []
): { score: number; reasons: string[] } {
    let score = 0;
    const reasons: string[] = [];

    // VIP sender (+50)
    if (vipList.some((vip) => email.fromEmail.toLowerCase().includes(vip.toLowerCase()))) {
        score += 50;
        reasons.push("VIP sender");
    }

    // Unread (+10)
    // if (email.isUnread) {
    //   score += 10;
    //   reasons.push("Unread");
    // }
    // Commented out unread bonus as it might bias towards newsletters. 
    // Focus on content.

    // External sender (+15)
    const emailDomain = email.fromEmail.split("@")[1]?.toLowerCase();
    if (emailDomain && emailDomain !== userDomain.toLowerCase()) {
        score += 15;
        reasons.push("External sender");
    }

    // Has attachments from external (+10)
    if (email.hasAttachments && emailDomain !== userDomain.toLowerCase()) {
        score += 10;
        reasons.push("External with attachments");
    }

    // Urgency keywords in subject (+30)
    const subjectLower = email.subject.toLowerCase();
    if (URGENCY_KEYWORDS.some((kw) => subjectLower.includes(kw))) {
        score += 30;
        reasons.push("Urgency keywords");
    }

    // Business keywords (+15)
    if (BUSINESS_KEYWORDS.some((kw) => subjectLower.includes(kw))) {
        score += 15;
        reasons.push("Business keywords");
    }

    // Gmail "Important" label (+20)
    // Note: 'IMPORTANT' is a system label in Gmail
    if (email.labels.includes("IMPORTANT")) {
        score += 20;
        reasons.push("Gmail marked important");
    }

    return { score, reasons };
}

export function getTopImportantEmails(
    emails: EmailSummary[],
    userDomain: string,
    vipList: string[] = [],
    maxResults: number = 5
) {
    return emails
        .map((e) => ({ email: e, ...scoreEmailImportance(e, userDomain, vipList) }))
        .filter((s) => s.score > 0)
        .sort((a, b) => b.score - a.score)
        .slice(0, maxResults);
}

// ===========================================
// CALENDAR HEURISTICS
// ===========================================

export function categorizeEvents(events: CalendarEvent[]) {
    return events
        .filter((e) => e.status !== "cancelled")
        .map((event) => {
            const reasons: string[] = [];
            let priority: "high" | "medium" | "low" = "low";

            if (event.hasExternalAttendees) {
                priority = "high";
                reasons.push("External attendees");
            }

            const titleLower = event.title.toLowerCase();
            if (titleLower.includes("interview") || titleLower.includes("entrevista") ||
                titleLower.includes("client") || titleLower.includes("cliente")) {
                priority = "high";
                reasons.push("Important meeting");
            }

            if (event.attendees.length > 5 && priority === "low") {
                priority = "medium";
                reasons.push("Large meeting");
            }

            return { event, priority, reasons };
        })
        .sort((a, b) => {
            const priorityOrder = { high: 0, medium: 1, low: 2 };
            // Sort by priority first, then start time
            if (priorityOrder[a.priority] !== priorityOrder[b.priority]) {
                return priorityOrder[a.priority] - priorityOrder[b.priority];
            }
            return a.event.startTime.getTime() - b.event.startTime.getTime();
        });
}

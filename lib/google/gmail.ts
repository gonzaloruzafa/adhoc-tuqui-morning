import { google } from "googleapis";
import { getAuthorizedClient } from "./auth";

export interface EmailSummary {
    id: string;
    threadId: string;
    from: string;
    fromEmail: string;
    subject: string;
    snippet: string;
    date: Date;
    hasAttachments: boolean;
    isUnread: boolean;
    labels: string[];
}

export interface EmailForProfile {
    id: string;
    threadId: string;
    from: string;
    fromEmail: string;
    to: string[];
    toEmails: string[];
    subject: string;
    snippet: string;
    bodyPreview: string;      // NUEVO: primeros 500 chars del body
    date: Date;
    hasAttachments: boolean;
    isUnread: boolean;
    labels: string[];
    direction: 'sent' | 'received';  // NUEVO: crucial para inferir rol
}

export async function fetchRecentEmails(
    accessToken: string,
    options: {
        maxResults?: number;
        hoursBack?: number;
        q?: string;
        onProgress?: (count: number, total: number) => Promise<void>;
    } = {}
): Promise<EmailSummary[]> {
    const { maxResults = 100, hoursBack = 24, q, onProgress } = options;
    const auth = getAuthorizedClient(accessToken);
    const gmail = google.gmail({ version: "v1", auth });

    const afterTimestamp = Math.floor(
        (Date.now() - hoursBack * 60 * 60 * 1000) / 1000
    );

    try {
        const query = q !== undefined ? q : `in:inbox after:${afterTimestamp}`;
        console.log(`[Gmail] Listing messages with query: ${query}`);
        const response = await gmail.users.messages.list({
            userId: "me",
            maxResults,
            q: query,
        });

        if (!response.data.messages) return [];

        const messageIds = response.data.messages;
        const total = messageIds.length;
        const results: EmailSummary[] = [];

        // Fetch details in parallel with larger concurrency
        const chunkSize = 25;
        for (let i = 0; i < messageIds.length; i += chunkSize) {
            const chunk = messageIds.slice(i, i + chunkSize);
            console.log(`[Gmail] Fetching chunk ${i / chunkSize + 1} (${chunk.length} messages)`);

            const chunkDetails = await Promise.all(
                chunk.map(async (msg) => {
                    try {
                        const detail = await gmail.users.messages.get({
                            userId: "me",
                            id: msg.id!,
                            format: "metadata",
                            metadataHeaders: ["From", "Subject", "Date"],
                        });

                        const headers = detail.data.payload?.headers || [];
                        const getHeader = (name: string) =>
                            headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

                        const fromHeader = getHeader("From");
                        const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/) || ["", fromHeader, fromHeader];

                        return {
                            id: msg.id!,
                            threadId: msg.threadId!,
                            from: fromMatch[1].replace(/"/g, "").trim() || fromMatch[2] || "Unknown",
                            fromEmail: (fromMatch[2] || fromHeader).replace(/[<>]/g, ""),
                            subject: getHeader("Subject") || "(No Subject)",
                            snippet: detail.data.snippet || "",
                            date: new Date(parseInt(detail.data.internalDate || "0")),
                            hasAttachments: detail.data.payload?.parts?.some((p) => p.filename && p.filename.length > 0) || false,
                            isUnread: detail.data.labelIds?.includes("UNREAD") || false,
                            labels: detail.data.labelIds || [],
                        };
                    } catch (e) {
                        console.error(`Failed to fetch email details for ${msg.id}`, e);
                        return null;
                    }
                })
            );

            results.push(...chunkDetails.filter((e): e is EmailSummary => e !== null));

            if (onProgress) {
                await onProgress(results.length, total);
            }
        }

        return results;
    } catch (error) {
        console.error("Error fetching emails:", error);
        throw error;
    }
}

/**
 * Fetch emails optimizado para análisis de perfil
 * Incluye ENVIADOS y RECIBIDOS, con body preview
 */
export async function fetchEmailsForProfile(
    accessToken: string,
    options: {
        maxResults?: number;
        daysBack?: number;
        onProgress?: (count: number, total: number) => Promise<void>;
    } = {}
): Promise<EmailForProfile[]> {
    const { maxResults = 500, daysBack = 60, onProgress } = options;
    const auth = getAuthorizedClient(accessToken);
    const gmail = google.gmail({ version: "v1", auth });

    const afterTimestamp = Math.floor(
        (Date.now() - daysBack * 24 * 60 * 60 * 1000) / 1000
    );

    try {
        // Query que incluye ENVIADOS y RECIBIDOS, excluye spam/trash
        const query = `after:${afterTimestamp} -in:spam -in:trash`;
        console.log(`[Gmail Profile] Fetching with query: ${query}`);

        const response = await gmail.users.messages.list({
            userId: "me",
            maxResults,
            q: query,
        });

        if (!response.data.messages) return [];

        // Obtener el email del usuario para determinar dirección
        const profileRes = await gmail.users.getProfile({ userId: "me" });
        const userEmail = profileRes.data.emailAddress?.toLowerCase() || "";

        const messageIds = response.data.messages;
        const total = messageIds.length;
        const results: EmailForProfile[] = [];

        const chunkSize = 40;
        for (let i = 0; i < messageIds.length; i += chunkSize) {
            const chunk = messageIds.slice(i, i + chunkSize);
            console.log(`[Gmail Profile] Fetching chunk ${i / chunkSize + 1} (${chunk.length} messages)`);

            const chunkDetails = await Promise.all(
                chunk.map(async (msg) => {
                    try {
                        const detail = await gmail.users.messages.get({
                            userId: "me",
                            id: msg.id!,
                            format: "full",
                        });

                        const headers = detail.data.payload?.headers || [];
                        const getHeader = (name: string) =>
                            headers.find((h) => h.name?.toLowerCase() === name.toLowerCase())?.value || "";

                        // Parse From
                        const fromHeader = getHeader("From");
                        const fromMatch = fromHeader.match(/^(.+?)\s*<(.+?)>$/) || ["", fromHeader, fromHeader];
                        const fromEmail = (fromMatch[2] || fromHeader).replace(/[<>]/g, "").toLowerCase();

                        // Parse To (puede ser múltiple)
                        const toHeader = getHeader("To");
                        const toEmails = toHeader.split(",").map(t => {
                            const match = t.match(/<(.+?)>/) || [t, t];
                            return match[1].trim().toLowerCase();
                        });

                        // Determinar dirección
                        const direction: 'sent' | 'received' =
                            fromEmail.includes(userEmail) || detail.data.labelIds?.includes("SENT")
                                ? 'sent'
                                : 'received';

                        // Extraer body preview (primeros 500 chars)
                        let bodyPreview = "";

                        // Función recursiva para buscar el texto plano
                        const findTextPart = (payload: any): string => {
                            if (payload.mimeType === "text/plain" && payload.body?.data) {
                                return Buffer.from(payload.body.data, 'base64').toString('utf-8');
                            }
                            if (payload.parts) {
                                for (const part of payload.parts) {
                                    const result = findTextPart(part);
                                    if (result) return result;
                                }
                            }
                            return "";
                        };

                        const fullText = findTextPart(detail.data.payload || {});
                        if (fullText) {
                            bodyPreview = fullText.substring(0, 500).replace(/\s+/g, ' ').trim();
                        } else if (detail.data.snippet) {
                            bodyPreview = detail.data.snippet;
                        }

                        return {
                            id: msg.id!,
                            threadId: msg.threadId!,
                            from: fromMatch[1].replace(/"/g, "").trim() || fromMatch[2] || "Unknown",
                            fromEmail,
                            to: toHeader.split(",").map(t => t.trim()),
                            toEmails,
                            subject: getHeader("Subject") || "(No Subject)",
                            snippet: detail.data.snippet || "",
                            bodyPreview,
                            date: new Date(parseInt(detail.data.internalDate || "0")),
                            hasAttachments: detail.data.payload?.parts?.some((p) => p.filename && p.filename.length > 0) || false,
                            isUnread: detail.data.labelIds?.includes("UNREAD") || false,
                            labels: detail.data.labelIds || [],
                            direction,
                        };
                    } catch (e) {
                        console.error(`Failed to fetch email ${msg.id}`, e);
                        return null;
                    }
                })
            );

            results.push(...chunkDetails.filter((e): e is EmailForProfile => e !== null));

            if (onProgress) {
                await onProgress(results.length, total);
            }
        }

        console.log(`[Gmail Profile] Fetched ${results.length} emails (${results.filter(e => e.direction === 'sent').length} sent, ${results.filter(e => e.direction === 'received').length} received)`);
        return results;

    } catch (error) {
        console.error("Error fetching emails for profile:", error);
        throw error;
    }
}

/**
 * Envío de email vía Gmail API (Fallback de WhatsApp)
 */
export async function sendEmail(
    accessToken: string,
    to: string,
    subject: string,
    body: string
) {
    const auth = getAuthorizedClient(accessToken);
    const gmail = google.gmail({ version: "v1", auth });

    const waNumber = process.env.TWILIO_WHATSAPP_NUMBER || "+14155238886";
    const waLink = `https://wa.me/${waNumber.replace('whatsapp:', '')}?text=${encodeURIComponent("Hola Tuqui! Despertate ☀️")}`;

    // Template moderno y profesional
    const htmlBody = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 40px 20px; color: #1a1a1a; background-color: #f9fafb;">
            <div style="background-color: #ffffff; padding: 40px; border-radius: 24px; box-shadow: 0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06);">
                <div style="margin-bottom: 32px; text-align: center;">
                    <h1 style="margin: 0; font-size: 28px; font-weight: 900; color: #7C3AED;">Tuqui Morning ☀️</h1>
                    <p style="margin: 8px 0 0 0; color: #6b7280; font-weight: 500; font-size: 14px; text-transform: uppercase; tracking: 0.05em;">Tu briefing diario personalizado</p>
                </div>

                <div style="line-height: 1.8; font-size: 16px; color: #374151; margin-bottom: 40px;">
                    ${body.replace(/\n/g, '<br>')}
                </div>

                <div style="text-align: center; background-color: #f3f4f6; padding: 32px; border-radius: 20px;">
                    <p style="margin-top: 0; font-weight: 700; color: #111827; font-size: 15px;">¿Querés recibir esto por WhatsApp mañana?</p>
                    <p style="margin-bottom: 24px; color: #6b7280; font-size: 14px;">Tu ventana de 24hs se cerró. Tocá el botón para reactivarla.</p>
                    
                    <a href="${waLink}" style="display: inline-block; background-color: #25D366; color: white; padding: 16px 32px; border-radius: 14px; text-decoration: none; font-weight: 800; font-size: 14px; text-transform: uppercase; letter-spacing: 0.025em; box-shadow: 0 10px 15px -3px rgba(37, 211, 102, 0.3);">
                        Activar WhatsApp
                    </a>
                </div>
            </div>
            
            <p style="font-size: 12px; color: #9ca3af; text-align: center; margin-top: 32px;">
                Adhoc Tuqui - Inteligencia para tu mañana.<br>
                Recibiste este mail porque el delivery directo de WhatsApp no estaba disponible.
            </p>
        </div>
    `;

    const utf8Subject = `=?utf-8?B?${Buffer.from(subject).toString('base64')}?=`;
    const messageParts = [
        `To: ${to}`,
        'Content-Type: text/html; charset=utf-8',
        'MIME-Version: 1.0',
        `Subject: ${utf8Subject}`,
        '',
        htmlBody,
    ];
    const message = messageParts.join('\n');

    const encodedMessage = Buffer.from(message)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/, '');

    try {
        await gmail.users.messages.send({
            userId: 'me',
            requestBody: {
                raw: encodedMessage,
            },
        });
        return { success: true };
    } catch (error) {
        console.error('[Gmail Send] Failed:', error);
        throw error;
    }
}

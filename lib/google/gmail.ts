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

        // Fetch details in chunks to avoid timeouts and allow progress reporting
        const chunkSize = 15;
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

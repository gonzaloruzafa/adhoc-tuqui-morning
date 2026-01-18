import { google } from "googleapis";
import { getAuthorizedClient } from "./auth";

export interface CalendarEvent {
    id: string;
    title: string;
    startTime: Date;
    endTime: Date;
    isAllDay: boolean;
    attendees: string[];
    hasExternalAttendees: boolean;
    meetingLink?: string;
    status: string;
}

export async function fetchTodayEvents(
    accessToken: string,
    timezone: string
): Promise<CalendarEvent[]> {
    const auth = getAuthorizedClient(accessToken);
    const calendar = google.calendar({ version: "v3", auth });

    const now = new Date();

    // Create start of day in User's timezone
    // Note: Date object is UTC, we need ISO string ref for the query
    const startOfDay = new Date(now.toLocaleDateString("en-US", { timeZone: timezone }));
    const endOfDay = new Date(startOfDay);
    endOfDay.setDate(endOfDay.getDate() + 1);

    try {
        const response = await calendar.events.list({
            calendarId: "primary",
            timeMin: startOfDay.toISOString(),
            timeMax: endOfDay.toISOString(),
            singleEvents: true,
            orderBy: "startTime",
            maxResults: 20,
        });

        return (response.data.items || []).map((event) => {
            const attendees = event.attendees || [];
            const userEmail = attendees.find((a) => a.self)?.email || "";
            const userDomain = userEmail.split("@")[1] || "";

            return {
                id: event.id!,
                title: event.summary || "(Sin título)",
                startTime: new Date(event.start?.dateTime || event.start?.date || ""),
                endTime: new Date(event.end?.dateTime || event.end?.date || ""),
                isAllDay: !event.start?.dateTime,
                attendees: attendees.map((a) => a.email || ""),
                hasExternalAttendees: attendees.some((a) => {
                    if (a.self) return false;
                    const domain = a.email?.split("@")[1];
                    return domain && domain !== userDomain;
                }),
                meetingLink: event.hangoutLink || event.conferenceData?.entryPoints?.[0]?.uri || undefined,
                status: event.status || "confirmed",
            };
        });
    } catch (error) {
        console.error("Error fetching calendar events:", error);
        throw error;
    }
}

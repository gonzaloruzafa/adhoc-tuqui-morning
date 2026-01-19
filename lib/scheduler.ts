import { DateTime } from "luxon";

/**
 * Calculates the next run time in UTC based on user preferences.
 * @param timeLocal - HH:MM string in user timezone
 * @param timezone - IANA timezone string
 * @param daysOfWeek - Array of days [0-6] (0=Sunday)
 * @param from - Reference time (defaults to now)
 */
export function calculateNextRunAt(
    timeLocal: string,
    timezone: string,
    daysOfWeek: number[] = [1, 2, 3, 4, 5],
    from: Date = new Date()
): Date {
    const [hour, minute] = timeLocal.split(":").map(Number);

    // 1. Start with the "from" time in the target timezone
    let next = DateTime.fromJSDate(from).setZone(timezone).set({
        hour,
        minute,
        second: 0,
        millisecond: 0,
    });

    // 2. If the time has already passed today, move to tomorrow
    if (next <= DateTime.fromJSDate(from).setZone(timezone)) {
        next = next.plus({ days: 1 });
    }

    // 3. Keep moving forward until we hit an allowed day
    let attempts = 0;
    while (!daysOfWeek.includes(next.weekday % 7) && attempts < 8) {
        next = next.plus({ days: 1 });
        attempts++;
    }

    return next.toJSDate();
}

"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.calendarService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const googleapis_1 = require("googleapis");
const luxon_1 = require("luxon");
const zod_1 = require("zod");
const config_1 = require("../config");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const google_service_1 = require("./google.service");
const freeSlotSchema = zod_1.z.object({
    interviewerEmail: zod_1.z.string().email(),
    date: zod_1.z.string(),
    durationMinutes: zod_1.z.number().int().positive().optional(),
});
async function getUserByEmail(email) {
    const user = await db_1.db.query.users.findFirst({
        where: (0, drizzle_orm_1.eq)(schema_1.users.email, email.toLowerCase()),
    });
    if (!user) {
        throw new types_1.AppError('Interviewer not found', 404);
    }
    return user;
}
async function getCalendarAuth(email) {
    const user = await getUserByEmail(email);
    const auth = (0, google_service_1.createOAuth2Client)({
        accessToken: user.googleAccessToken,
        refreshToken: user.googleRefreshToken,
    });
    auth.on('tokens', async (tokens) => {
        await db_1.db
            .update(schema_1.users)
            .set({
            googleAccessToken: tokens.access_token || user.googleAccessToken,
            googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.users.id, user.id));
    });
    await auth.getAccessToken();
    return googleapis_1.google.calendar({ version: 'v3', auth });
}
function calculateFreeWindows(busyBlocks, date, timezone, durationMinutes) {
    const workStart = config_1.config.scheduling.workDayStartHour;
    const workEnd = config_1.config.scheduling.workDayEndHour;
    const increment = config_1.config.scheduling.freeSlotIncrementMinutes;
    const buffer = config_1.config.scheduling.freeSlotBufferMinutes;
    const day = luxon_1.DateTime.fromISO(date, { zone: timezone });
    const startBoundary = day.startOf('day').set({ hour: workStart, minute: 0 });
    const endBoundary = day.startOf('day').set({ hour: workEnd, minute: 0 });
    const sorted = [...busyBlocks].sort((a, b) => a.start.localeCompare(b.start));
    const freeSlots = [];
    let pointer = startBoundary;
    const now = luxon_1.DateTime.now().setZone(timezone).plus({ minutes: buffer });
    for (const block of sorted) {
        const busyStart = luxon_1.DateTime.fromISO(block.start, { zone: timezone });
        const busyEnd = luxon_1.DateTime.fromISO(block.end, { zone: timezone });
        while (pointer.plus({ minutes: durationMinutes }) <= busyStart) {
            if (pointer >= now) {
                freeSlots.push({
                    start: pointer.toISO() || '',
                    end: pointer.plus({ minutes: durationMinutes }).toISO() || '',
                });
            }
            pointer = pointer.plus({ minutes: increment });
        }
        if (busyEnd > pointer) {
            pointer = busyEnd;
        }
    }
    while (pointer.plus({ minutes: durationMinutes }) <= endBoundary) {
        if (pointer >= now) {
            freeSlots.push({
                start: pointer.toISO() || '',
                end: pointer.plus({ minutes: durationMinutes }).toISO() || '',
            });
        }
        pointer = pointer.plus({ minutes: increment });
    }
    return freeSlots;
}
exports.calendarService = {
    getCalendarClientForEmail: async (email) => getCalendarAuth(email),
    getTimezone: async (interviewerEmail) => {
        const cal = await getCalendarAuth(interviewerEmail);
        const tzSetting = await cal.settings.get({ setting: 'timezone' });
        return tzSetting.data.value || 'UTC';
    },
    getFreeSlots: async (interviewerEmail, date, durationMinutes = config_1.config.scheduling.defaultInterviewDurationMinutes, _userId) => {
        freeSlotSchema.parse({ interviewerEmail, date, durationMinutes });
        const cal = await getCalendarAuth(interviewerEmail);
        const timezone = await exports.calendarService.getTimezone(interviewerEmail);
        const startOfDay = luxon_1.DateTime.fromISO(date, { zone: timezone })
            .startOf('day')
            .toISO();
        const endOfDay = luxon_1.DateTime.fromISO(date, { zone: timezone })
            .endOf('day')
            .toISO();
        const events = await cal.events.list({
            calendarId: 'primary',
            timeMin: startOfDay || undefined,
            timeMax: endOfDay || undefined,
            singleEvents: true,
            orderBy: 'startTime',
        });
        const busyBlocks = events.data.items
            ?.filter((event) => event.status !== 'cancelled')
            .map((event) => ({
            start: event.start?.dateTime || event.start?.date || '',
            end: event.end?.dateTime || event.end?.date || '',
            summary: event.summary || 'Busy',
        }))
            .filter((event) => event.start && event.end) || [];
        const freeSlots = calculateFreeWindows(busyBlocks, date, timezone, durationMinutes);
        return {
            busyBlocks,
            freeSlots,
            timezone,
            timezoneOffset: luxon_1.DateTime.now().setZone(timezone).toFormat('ZZ'),
        };
    },
};

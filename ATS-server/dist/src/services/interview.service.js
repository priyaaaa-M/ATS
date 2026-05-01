"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.interviewService = void 0;
const drizzle_orm_1 = require("drizzle-orm");
const luxon_1 = require("luxon");
const zod_1 = require("zod");
const db_1 = require("../db");
const schema_1 = require("../db/schema");
const types_1 = require("../types");
const calendar_service_1 = require("./calendar.service");
const bookInterviewSchema = zod_1.z.object({
    candidateId: zod_1.z.string().uuid(),
    candidateEmail: zod_1.z.string().email(),
    interviewerEmail: zod_1.z.string().email(),
    date: zod_1.z.string(),
    startTime: zod_1.z.string(),
    endTime: zod_1.z.string(),
    roleName: zod_1.z.string().min(1),
    roundNumber: zod_1.z.number().int().positive(),
    durationMinutes: zod_1.z.number().int().positive().optional(),
    hrUserId: zod_1.z.string().uuid(),
});
const rescheduleSchema = zod_1.z.object({
    date: zod_1.z.string(),
    startTime: zod_1.z.string(),
    endTime: zod_1.z.string(),
});
exports.interviewService = {
    list: async (userId, userRole, userEmail) => {
        const interviews = await db_1.db
            .select({
            id: schema_1.scheduledInterviews.id,
            candidateId: schema_1.scheduledInterviews.candidateId,
            interviewerEmail: schema_1.scheduledInterviews.interviewerEmail,
            roundNumber: schema_1.scheduledInterviews.roundNumber,
            scheduledStartTime: schema_1.scheduledInterviews.scheduledStartTime,
            scheduledEndTime: schema_1.scheduledInterviews.scheduledEndTime,
            durationMinutes: schema_1.scheduledInterviews.durationMinutes,
            googleEventId: schema_1.scheduledInterviews.googleEventId,
            meetLink: schema_1.scheduledInterviews.meetLink,
            status: schema_1.scheduledInterviews.status,
            transcriptReceived: schema_1.scheduledInterviews.transcriptReceived,
            createdAt: schema_1.scheduledInterviews.createdAt,
            candidateName: schema_1.candidates.name,
            candidateEmail: schema_1.candidates.candidateEmail,
            candidateRole: schema_1.candidates.role,
        })
            .from(schema_1.scheduledInterviews)
            .innerJoin(schema_1.candidates, (0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.candidateId, schema_1.candidates.id))
            .where(userRole === 'hr'
            ? (0, drizzle_orm_1.eq)(schema_1.candidates.userId, userId)
            : (0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.interviewerEmail, userEmail))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.scheduledInterviews.scheduledStartTime));
        return interviews;
    },
    bookInterview: async (input) => {
        const payload = bookInterviewSchema.parse(input);
        const candidate = await db_1.db.query.candidates.findFirst({
            where: (0, drizzle_orm_1.and)((0, drizzle_orm_1.eq)(schema_1.candidates.id, payload.candidateId), (0, drizzle_orm_1.eq)(schema_1.candidates.userId, payload.hrUserId)),
        });
        if (!candidate) {
            throw new types_1.AppError('Candidate not found', 404);
        }
        const timezone = await calendar_service_1.calendarService.getTimezone(payload.interviewerEmail);
        const startDT = luxon_1.DateTime.fromISO(`${payload.date}T${payload.startTime}`, {
            zone: timezone,
        });
        const endDT = luxon_1.DateTime.fromISO(`${payload.date}T${payload.endTime}`, {
            zone: timezone,
        });
        if (startDT <= luxon_1.DateTime.now().setZone(timezone)) {
            throw new types_1.AppError('Interview start time must be in the future', 400);
        }
        const calendar = await calendar_service_1.calendarService.getCalendarClientForEmail(payload.interviewerEmail);
        const event = await calendar.events.insert({
            calendarId: 'primary',
            conferenceDataVersion: 1,
            requestBody: {
                summary: `${payload.roleName} Interview - Round ${payload.roundNumber} - ${candidate.name || 'Candidate'}`,
                start: { dateTime: startDT.toISO() || undefined, timeZone: timezone },
                end: { dateTime: endDT.toISO() || undefined, timeZone: timezone },
                attendees: [
                    { email: payload.candidateEmail },
                    { email: payload.interviewerEmail },
                ],
                conferenceData: {
                    createRequest: {
                        requestId: `interview-${payload.candidateId}-${Date.now()}`,
                        conferenceSolutionKey: { type: 'hangoutsMeet' },
                    },
                },
                reminders: {
                    useDefault: false,
                    overrides: [
                        { method: 'email', minutes: 30 },
                        { method: 'popup', minutes: 10 },
                    ],
                },
            },
        });
        const meetLink = event.data.conferenceData?.entryPoints?.find((entry) => entry.entryPointType === 'video')?.uri || null;
        const [interview] = await db_1.db
            .insert(schema_1.scheduledInterviews)
            .values({
            candidateId: payload.candidateId,
            interviewerEmail: payload.interviewerEmail,
            roundNumber: payload.roundNumber,
            scheduledStartTime: startDT.toJSDate(),
            scheduledEndTime: endDT.toJSDate(),
            durationMinutes: payload.durationMinutes || endDT.diff(startDT, 'minutes').minutes,
            googleEventId: event.data.id || null,
            meetLink,
            status: 'scheduled',
        })
            .returning();
        await db_1.db
            .update(schema_1.candidates)
            .set({
            status: 'scheduled',
            roundStatus: 'scheduled',
            updatedAt: new Date(),
        })
            .where((0, drizzle_orm_1.eq)(schema_1.candidates.id, payload.candidateId));
        return {
            success: true,
            meetLink,
            eventId: event.data.id,
            interview,
        };
    },
    rescheduleInterview: async (id, input, actorUserId) => {
        const payload = rescheduleSchema.parse(input);
        const interview = await db_1.db.query.scheduledInterviews.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.id, id),
        });
        if (!interview) {
            throw new types_1.AppError('Interview not found', 404);
        }
        const candidate = await db_1.db.query.candidates.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.candidates.id, interview.candidateId),
        });
        if (!candidate || candidate.userId !== actorUserId) {
            throw new types_1.AppError('Forbidden', 403);
        }
        const timezone = await calendar_service_1.calendarService.getTimezone(interview.interviewerEmail);
        const startDT = luxon_1.DateTime.fromISO(`${payload.date}T${payload.startTime}`, {
            zone: timezone,
        });
        const endDT = luxon_1.DateTime.fromISO(`${payload.date}T${payload.endTime}`, {
            zone: timezone,
        });
        const calendar = await calendar_service_1.calendarService.getCalendarClientForEmail(interview.interviewerEmail);
        if (interview.googleEventId) {
            await calendar.events.patch({
                calendarId: 'primary',
                eventId: interview.googleEventId,
                requestBody: {
                    start: { dateTime: startDT.toISO() || undefined, timeZone: timezone },
                    end: { dateTime: endDT.toISO() || undefined, timeZone: timezone },
                },
            });
        }
        const [updated] = await db_1.db
            .update(schema_1.scheduledInterviews)
            .set({
            scheduledStartTime: startDT.toJSDate(),
            scheduledEndTime: endDT.toJSDate(),
            status: 'rescheduled',
        })
            .where((0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.id, id))
            .returning();
        return updated;
    },
    cancelInterview: async (id, actorUserId) => {
        const interview = await db_1.db.query.scheduledInterviews.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.id, id),
        });
        if (!interview) {
            throw new types_1.AppError('Interview not found', 404);
        }
        const candidate = await db_1.db.query.candidates.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.candidates.id, interview.candidateId),
        });
        if (!candidate || candidate.userId !== actorUserId) {
            throw new types_1.AppError('Forbidden', 403);
        }
        if (interview.googleEventId) {
            const calendar = await calendar_service_1.calendarService.getCalendarClientForEmail(interview.interviewerEmail);
            await calendar.events.delete({
                calendarId: 'primary',
                eventId: interview.googleEventId,
            });
        }
        const [updated] = await db_1.db
            .update(schema_1.scheduledInterviews)
            .set({ status: 'cancelled' })
            .where((0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.id, id))
            .returning();
        return updated;
    },
    getByCandidateId: async (candidateId, userId, userRole, userEmail) => {
        const candidate = await db_1.db.query.candidates.findFirst({
            where: (0, drizzle_orm_1.eq)(schema_1.candidates.id, candidateId),
        });
        if (!candidate) {
            throw new types_1.AppError('Candidate not found', 404);
        }
        if (userRole === 'hr' && candidate.userId !== userId) {
            throw new types_1.AppError('Forbidden', 403);
        }
        if (userRole === 'interviewer' &&
            candidate.assignedInterviewerEmail !== userEmail) {
            throw new types_1.AppError('Forbidden', 403);
        }
        return db_1.db
            .select()
            .from(schema_1.scheduledInterviews)
            .where((0, drizzle_orm_1.eq)(schema_1.scheduledInterviews.candidateId, candidateId))
            .orderBy((0, drizzle_orm_1.desc)(schema_1.scheduledInterviews.scheduledStartTime));
    },
};

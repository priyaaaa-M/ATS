import { and, desc, eq, gte, lt } from 'drizzle-orm'
import { DateTime } from 'luxon'
import { z } from 'zod'
import { db } from '../db'
import { candidates, scheduledInterviews } from '../db/schema'
import { AppError } from '../types'
import { activityService } from './activity.service'
import { calendarService } from './calendar.service'
import { slackService } from './slack.service'

const bookInterviewSchema = z.object({
  candidateId: z.string().uuid(),
  candidateEmail: z.string().email(),
  interviewerEmail: z.string().email(),
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
  roleName: z.string().min(1),
  roundNumber: z.number().int().positive(),
  durationMinutes: z.number().int().positive().optional(),
  hrUserId: z.string().uuid(),
})

const rescheduleSchema = z.object({
  date: z.string(),
  startTime: z.string(),
  endTime: z.string(),
})

export const interviewService = {
  list: async (
    userId: string,
    userRole: 'hr' | 'interviewer',
    userEmail: string
  ) => {
    const interviews = await db
      .select({
        id: scheduledInterviews.id,
        candidateId: scheduledInterviews.candidateId,
        interviewerEmail: scheduledInterviews.interviewerEmail,
        roundNumber: scheduledInterviews.roundNumber,
        scheduledStartTime: scheduledInterviews.scheduledStartTime,
        scheduledEndTime: scheduledInterviews.scheduledEndTime,
        durationMinutes: scheduledInterviews.durationMinutes,
        googleEventId: scheduledInterviews.googleEventId,
        meetLink: scheduledInterviews.meetLink,
        status: scheduledInterviews.status,
        transcriptReceived: scheduledInterviews.transcriptReceived,
        createdAt: scheduledInterviews.createdAt,
        candidateName: candidates.name,
        candidateEmail: candidates.candidateEmail,
        candidateRole: candidates.role,
      })
      .from(scheduledInterviews)
      .innerJoin(candidates, eq(scheduledInterviews.candidateId, candidates.id))
      .where(
        userRole === 'hr'
          ? eq(candidates.userId, userId)
          : eq(scheduledInterviews.interviewerEmail, userEmail)
      )
      .orderBy(desc(scheduledInterviews.scheduledStartTime))

    return interviews
  },

  getByWeek: async (
    userId: string,
    userRole: 'hr' | 'interviewer',
    userEmail: string,
    weekStart: string
  ) => {
    const start = new Date(`${weekStart}T00:00:00.000Z`)
    const end = new Date(start)
    end.setUTCDate(end.getUTCDate() + 7)

    const interviews = await interviewService.list(userId, userRole, userEmail)
    return interviews.filter((item) => {
      if (!item.scheduledStartTime) return false
      const when = new Date(item.scheduledStartTime)
      return when >= start && when < end
    })
  },

  getMine: async (
    userId: string,
    userRole: 'hr' | 'interviewer',
    userEmail: string
  ) => interviewService.list(userId, userRole, userEmail),

  bookInterview: async (input: unknown) => {
    const payload = bookInterviewSchema.parse(input)
    const candidate = await db.query.candidates.findFirst({
      where: and(
        eq(candidates.id, payload.candidateId),
        eq(candidates.userId, payload.hrUserId)
      ),
    })

    if (!candidate) {
      throw new AppError('Candidate not found', 404)
    }

    const timezone = await calendarService.getTimezone(payload.interviewerEmail)
    const startDT = DateTime.fromISO(`${payload.date}T${payload.startTime}`, {
      zone: timezone,
    })
    const endDT = DateTime.fromISO(`${payload.date}T${payload.endTime}`, {
      zone: timezone,
    })

    if (startDT <= DateTime.now().setZone(timezone)) {
      throw new AppError('Interview start time must be in the future', 400)
    }

    const calendar = await calendarService.getCalendarClientForEmail(
      payload.interviewerEmail
    )
    const event = await calendar.events.insert({
      calendarId: 'primary',
      conferenceDataVersion: 1,
      requestBody: {
        summary: `${payload.roleName} Interview - Round ${payload.roundNumber} - ${
          candidate.name || 'Candidate'
        }`,
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
    })

    const meetLink =
      event.data.conferenceData?.entryPoints?.find(
        (entry) => entry.entryPointType === 'video'
      )?.uri || null

    const [interview] = await db
      .insert(scheduledInterviews)
      .values({
        candidateId: payload.candidateId,
        interviewerEmail: payload.interviewerEmail,
        roundNumber: payload.roundNumber,
        scheduledStartTime: startDT.toJSDate(),
        scheduledEndTime: endDT.toJSDate(),
        durationMinutes:
          payload.durationMinutes || endDT.diff(startDT, 'minutes').minutes,
        googleEventId: event.data.id || null,
        meetLink,
        status: 'scheduled',
      })
      .returning()

    await db
      .update(candidates)
      .set({
        status: 'scheduled',
        roundStatus: 'scheduled',
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, payload.candidateId))

    await activityService.logActivity({
      userId: candidate.userId,
      type: 'interview_scheduled',
      message: `${payload.interviewerEmail} scheduled interview with ${candidate.name || candidate.candidateEmail || 'candidate'}`,
      candidateId: candidate.id,
      actorName: payload.interviewerEmail,
      actorInitials: payload.interviewerEmail.slice(0, 2).toUpperCase(),
    })

    return {
      success: true,
      meetLink,
      eventId: event.data.id,
      interview,
    }
  },

  rescheduleInterview: async (id: string, input: unknown, actorUserId: string) => {
    const payload = rescheduleSchema.parse(input)
    const interview = await db.query.scheduledInterviews.findFirst({
      where: eq(scheduledInterviews.id, id),
    })

    if (!interview) {
      throw new AppError('Interview not found', 404)
    }

    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, interview.candidateId),
    })

    if (!candidate || candidate.userId !== actorUserId) {
      throw new AppError('Forbidden', 403)
    }

    const timezone = await calendarService.getTimezone(interview.interviewerEmail)
    const startDT = DateTime.fromISO(`${payload.date}T${payload.startTime}`, {
      zone: timezone,
    })
    const endDT = DateTime.fromISO(`${payload.date}T${payload.endTime}`, {
      zone: timezone,
    })

    const calendar = await calendarService.getCalendarClientForEmail(
      interview.interviewerEmail
    )

    if (interview.googleEventId) {
      await calendar.events.patch({
        calendarId: 'primary',
        eventId: interview.googleEventId,
        requestBody: {
          start: { dateTime: startDT.toISO() || undefined, timeZone: timezone },
          end: { dateTime: endDT.toISO() || undefined, timeZone: timezone },
        },
      })
    }

    const [updated] = await db
      .update(scheduledInterviews)
      .set({
        scheduledStartTime: startDT.toJSDate(),
        scheduledEndTime: endDT.toJSDate(),
        status: 'rescheduled',
      })
      .where(eq(scheduledInterviews.id, id))
      .returning()

    return updated
  },

  cancelInterview: async (id: string, actorUserId: string) => {
    const interview = await db.query.scheduledInterviews.findFirst({
      where: eq(scheduledInterviews.id, id),
    })

    if (!interview) {
      throw new AppError('Interview not found', 404)
    }

    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, interview.candidateId),
    })

    if (!candidate || candidate.userId !== actorUserId) {
      throw new AppError('Forbidden', 403)
    }

    if (interview.googleEventId) {
      const calendar = await calendarService.getCalendarClientForEmail(
        interview.interviewerEmail
      )
      await calendar.events.delete({
        calendarId: 'primary',
        eventId: interview.googleEventId,
      })
    }

    const [updated] = await db
      .update(scheduledInterviews)
      .set({ status: 'cancelled' })
      .where(eq(scheduledInterviews.id, id))
      .returning()

    return updated
  },

  getByCandidateId: async (
    candidateId: string,
    userId: string,
    userRole: 'hr' | 'interviewer',
    userEmail: string
  ) => {
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, candidateId),
    })

    if (!candidate) {
      throw new AppError('Candidate not found', 404)
    }

    if (userRole === 'hr' && candidate.userId !== userId) {
      throw new AppError('Forbidden', 403)
    }

    if (
      userRole === 'interviewer' &&
      candidate.assignedInterviewerEmail !== userEmail
    ) {
      throw new AppError('Forbidden', 403)
    }

    return db
      .select()
      .from(scheduledInterviews)
      .where(eq(scheduledInterviews.candidateId, candidateId))
      .orderBy(desc(scheduledInterviews.scheduledStartTime))
  },

  sendReminder: async (
    id: string,
    userId: string,
    userRole: 'hr' | 'interviewer',
    userEmail: string
  ) => {
    const interview = await db.query.scheduledInterviews.findFirst({
      where: eq(scheduledInterviews.id, id),
    })

    if (!interview) {
      throw new AppError('Interview not found', 404)
    }

    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, interview.candidateId),
    })

    if (!candidate) {
      throw new AppError('Candidate not found', 404)
    }

    if (userRole === 'hr' && candidate.userId !== userId) {
      throw new AppError('Forbidden', 403)
    }

    if (userRole === 'interviewer' && interview.interviewerEmail !== userEmail) {
      throw new AppError('Forbidden', 403)
    }

    await slackService.sendGenericMessage(
      `Reminder: ${candidate.name || candidate.candidateEmail || 'Candidate'} still needs interview action for round ${interview.roundNumber}.`
    )

    return { success: true }
  },
}

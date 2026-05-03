import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  or,
} from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import {
  candidates,
  interviewFeedback,
  interviewRounds,
  interviewTranscripts,
  scheduledInterviews,
} from '../db/schema'
import type { CandidateFilters } from '../types'
import { AppError } from '../types'
import { slackService } from './slack.service'

const createCandidateSchema = z.object({
  userId: z.string().uuid(),
  companyId: z.string().uuid().nullable().optional(),
  role: z.string().min(1),
  name: z.string().optional(),
  candidateEmail: z.string().email().optional(),
  phone: z.string().optional(),
  resumeUrl: z.string().optional(),
  driveFileId: z.string().optional(),
  parsedData: z.any().optional(),
  atsScore: z.number().int().min(0).max(100).optional(),
})

async function getOwnedCandidate(candidateId: string, userId: string) {
  const candidate = await db.query.candidates.findFirst({
    where: and(eq(candidates.id, candidateId), eq(candidates.userId, userId)),
  })

  if (!candidate) {
    throw new AppError('Candidate not found', 404)
  }

  return candidate
}

export const candidateService = {
  list: async ({
    userId,
    userRole,
    userEmail,
    filters,
  }: {
    userId: string
    userRole: 'hr' | 'interviewer'
    userEmail: string
    filters: CandidateFilters
  }) => {
    const conditions = []

    if (userRole === 'hr') {
      conditions.push(eq(candidates.userId, userId))
    } else {
      conditions.push(eq(candidates.assignedInterviewerEmail, userEmail))
      conditions.push(
        inArray(candidates.status, ['hr_approved', 'scheduled', 'completed'])
      )
    }

    if (filters.role) conditions.push(eq(candidates.role, filters.role))
    if (filters.status) conditions.push(eq(candidates.status, filters.status))
    if (filters.round) conditions.push(eq(candidates.currentRound, filters.round))
    if (filters.minAtsScore !== undefined) {
      conditions.push(gte(candidates.atsScore, filters.minAtsScore))
    }
    if (filters.search) {
      conditions.push(
        or(
          ilike(candidates.name, `%${filters.search}%`),
          ilike(candidates.candidateEmail, `%${filters.search}%`)
        )!
      )
    }

    return db
      .select()
      .from(candidates)
      .where(and(...conditions))
      .orderBy(desc(candidates.createdAt))
  },

  getById: async (
    id: string,
    userId: string,
    userRole: 'hr' | 'interviewer',
    userEmail: string
  ) => {
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, id),
    })

    if (!candidate) {
      return null
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

    const [latestInterview] = await db
      .select()
      .from(scheduledInterviews)
      .where(eq(scheduledInterviews.candidateId, id))
      .orderBy(desc(scheduledInterviews.scheduledStartTime))
      .limit(1)

    const [feedback] = await db
      .select()
      .from(interviewFeedback)
      .where(
        and(
          eq(interviewFeedback.candidateId, id),
          eq(interviewFeedback.roundNumber, candidate.currentRound || 1)
        )
      )
      .orderBy(desc(interviewFeedback.updatedAt))
      .limit(1)

    const [transcript] = await db
      .select()
      .from(interviewTranscripts)
      .where(
        and(
          eq(interviewTranscripts.candidateId, id),
          eq(interviewTranscripts.roundNumber, candidate.currentRound || 1)
        )
      )
      .orderBy(desc(interviewTranscripts.receivedAt))
      .limit(1)

    return {
      ...candidate,
      latestInterview,
      feedback,
      transcript,
    }
  },

  approve: async (candidateId: string, hrUserId: string) => {
    const candidate = await getOwnedCandidate(candidateId, hrUserId)

    const roundOne = await db.query.interviewRounds.findFirst({
      where: and(
        eq(interviewRounds.userId, hrUserId),
        eq(interviewRounds.roleName, candidate.role),
        eq(interviewRounds.roundNumber, 1)
      ),
    })

    const allRounds = roundOne
      ? await db
          .select()
          .from(interviewRounds)
          .where(
            and(
              eq(interviewRounds.userId, hrUserId),
              eq(interviewRounds.roleName, candidate.role)
            )
          )
      : []

    const totalRounds =
      allRounds.length > 0
        ? Math.max(...allRounds.map((r) => r.roundNumber))
        : candidate.totalRounds || 1

    const [updated] = await db
      .update(candidates)
      .set({
        status: 'hr_approved',
        currentRound: 1,
        totalRounds,
        assignedInterviewerEmail: roundOne?.interviewerGmail ?? candidate.assignedInterviewerEmail,
        roundStatus: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId))
      .returning()

    if (roundOne) {
      await slackService.notifyInterviewerAssigned(
        roundOne.interviewerGmail,
        candidate.name || candidate.candidateEmail || 'Candidate',
        candidate.role,
        1
      )
    }

    return updated
  },

  hrAdvance: async (candidateId: string, hrUserId: string) => {
    const candidate = await getOwnedCandidate(candidateId, hrUserId)

    // If pending → move to hr_approved (already handled by approve, but as fallback)
    if (candidate.status === 'pending') {
      const [updated] = await db
        .update(candidates)
        .set({ status: 'hr_approved', currentRound: 1, roundStatus: 'pending', updatedAt: new Date() })
        .where(eq(candidates.id, candidateId))
        .returning()
      return { candidate: updated }
    }

    // If hr_approved → move to next round or select if no rounds configured
    if (candidate.status === 'hr_approved') {
      const nextRound = (candidate.currentRound || 1) + 1
      const totalRounds = candidate.totalRounds || 1

      if (nextRound > totalRounds) {
        // Move to selected if all rounds done
        const [selected] = await db
          .update(candidates)
          .set({ status: 'selected', roundStatus: 'completed', updatedAt: new Date() })
          .where(eq(candidates.id, candidateId))
          .returning()

        await slackService.notifyCandidateSelected(
          selected.name || selected.candidateEmail || 'Candidate',
          selected.role
        )
        return { selected: true, candidate: selected }
      }

      const nextRoundConfig = await db.query.interviewRounds.findFirst({
        where: and(
          eq(interviewRounds.userId, candidate.userId),
          eq(interviewRounds.roleName, candidate.role),
          eq(interviewRounds.roundNumber, nextRound)
        ),
      })

      const [updated] = await db
        .update(candidates)
        .set({
          currentRound: nextRound,
          assignedInterviewerEmail: nextRoundConfig?.interviewerGmail ?? candidate.assignedInterviewerEmail,
          roundStatus: 'pending',
          status: 'scheduled',
          updatedAt: new Date(),
        })
        .where(eq(candidates.id, candidateId))
        .returning()

      if (nextRoundConfig) {
        await slackService.notifyInterviewerAssigned(
          nextRoundConfig.interviewerGmail,
          updated.name || updated.candidateEmail || 'Candidate',
          updated.role,
          nextRound
        )
      }

      return { candidate: updated }
    }

    // If scheduled → advance to next round or select
    if (candidate.status === 'scheduled') {
      const nextRound = (candidate.currentRound || 1) + 1
      const totalRounds = candidate.totalRounds || 1

      if (nextRound > totalRounds) {
        const [selected] = await db
          .update(candidates)
          .set({ status: 'selected', roundStatus: 'completed', updatedAt: new Date() })
          .where(eq(candidates.id, candidateId))
          .returning()

        await slackService.notifyCandidateSelected(
          selected.name || selected.candidateEmail || 'Candidate',
          selected.role
        )
        return { selected: true, candidate: selected }
      }

      const nextRoundConfig = await db.query.interviewRounds.findFirst({
        where: and(
          eq(interviewRounds.userId, candidate.userId),
          eq(interviewRounds.roleName, candidate.role),
          eq(interviewRounds.roundNumber, nextRound)
        ),
      })

      const [updated] = await db
        .update(candidates)
        .set({
          currentRound: nextRound,
          assignedInterviewerEmail: nextRoundConfig?.interviewerGmail ?? candidate.assignedInterviewerEmail,
          roundStatus: 'pending',
          status: 'hr_approved',
          updatedAt: new Date(),
        })
        .where(eq(candidates.id, candidateId))
        .returning()

      return { candidate: updated }
    }

    throw new AppError('Cannot advance candidate from current status', 400)
  },

  advanceToNextRound: async (
    candidateId: string,
    _userId: string,
    userEmail: string
  ) => {
    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, candidateId),
    })

    if (!candidate) {
      throw new AppError('Candidate not found', 404)
    }

    if (candidate.assignedInterviewerEmail !== userEmail) {
      throw new AppError('Forbidden', 403)
    }

    const nextRound = (candidate.currentRound || 1) + 1
    if (nextRound > (candidate.totalRounds || 1)) {
      const [selected] = await db
        .update(candidates)
        .set({
          status: 'selected',
          roundStatus: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(candidates.id, candidateId))
        .returning()

      await slackService.notifyCandidateSelected(
        selected.name || selected.candidateEmail || 'Candidate',
        selected.role
      )

      return { selected: true, candidate: selected }
    }

    const nextRoundConfig = await db.query.interviewRounds.findFirst({
      where: and(
        eq(interviewRounds.userId, candidate.userId),
        eq(interviewRounds.roleName, candidate.role),
        eq(interviewRounds.roundNumber, nextRound)
      ),
    })

    if (!nextRoundConfig) {
      throw new AppError('Next round is not configured', 400)
    }

    const [updated] = await db
      .update(candidates)
      .set({
        currentRound: nextRound,
        assignedInterviewerEmail: nextRoundConfig.interviewerGmail,
        roundStatus: 'pending',
        status: 'hr_approved',
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId))
      .returning()

    await slackService.notifyInterviewerAssigned(
      nextRoundConfig.interviewerGmail,
      updated.name || updated.candidateEmail || 'Candidate',
      updated.role,
      nextRound
    )

    return updated
  },

  create: async (input: unknown) => {
    const payload = createCandidateSchema.parse(input)
    const [created] = await db
      .insert(candidates)
      .values({
        ...payload,
        companyId: payload.companyId || null,
        parsedSkills: payload.parsedData?.skills || [],
      })
      .returning()

    return created
  },

  reject: async (candidateId: string, userId: string) => {
    await getOwnedCandidate(candidateId, userId)
    const [updated] = await db
      .update(candidates)
      .set({
        status: 'rejected',
        roundStatus: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId))
      .returning()

    return updated
  },

  select: async (candidateId: string, userId: string) => {
    await getOwnedCandidate(candidateId, userId)
    const [updated] = await db
      .update(candidates)
      .set({
        status: 'selected',
        roundStatus: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId))
      .returning()

    return updated
  },

  getByDriveFileId: async (userId: string, driveFileId: string) =>
    db.query.candidates.findFirst({
      where: and(eq(candidates.userId, userId), eq(candidates.driveFileId, driveFileId)),
    }),
}

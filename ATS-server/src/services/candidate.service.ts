import {
  and,
  desc,
  eq,
  gte,
  ilike,
  inArray,
  or,
  sql,
} from 'drizzle-orm'
import crypto from 'crypto'
import { z } from 'zod'
import { db } from '../db'
import {
  candidates,
  interviewFeedback,
  interviewRounds,
  interviewTranscripts,
  notifications,
  roles,
  scheduledInterviews,
} from '../db/schema'
import type { CandidateFilters } from '../types'
import { AppError } from '../types'
import { activityService } from './activity.service'
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

const updateDriveCandidateSchema = z.object({
  name: z.string().optional(),
  candidateEmail: z.string().email().optional(),
  phone: z.string().optional(),
  resumeUrl: z.string().optional(),
  parsedData: z.any().optional(),
  atsScore: z.number().int().min(0).max(100).optional(),
})

const candidateActionSchema = z.object({
  userId: z.string().uuid(),
  userRole: z.enum(['hr', 'interviewer']),
  userEmail: z.string().email(),
  action: z.enum(['reject', 'maybe_later', 'interview']),
  reason: z.string().optional(),
})

const addNoteSchema = z.object({
  userId: z.string().uuid(),
  userRole: z.enum(['hr', 'interviewer']),
  userEmail: z.string().email(),
  text: z.string().min(1),
  isPrivate: z.boolean().optional(),
})

const saveScorecardSchema = z.object({
  userId: z.string().uuid(),
  userRole: z.enum(['hr', 'interviewer']),
  userEmail: z.string().email(),
  criteria: z
    .array(
      z.object({
        questionId: z.string(),
        value: z.enum(['yes', 'no', 'unknown']),
      })
    )
    .default([]),
  overallFit: z.string().optional().default(''),
})

const updateRoleScreeningSchema = z.object({
  screeningQuestions: z.array(
    z.object({
      id: z.string().optional(),
      question: z.string().min(1),
      type: z.enum(['yes_no', 'scale']).optional().default('yes_no'),
      required: z.boolean().optional().default(false),
    })
  ),
})

let feedbackColumnsReady: Promise<void> | null = null
let roleColumnsReady: Promise<void> | null = null

async function ensureFeedbackColumns() {
  if (!feedbackColumnsReady) {
    feedbackColumnsReady = (async () => {
      await db.execute(sql`
        alter table interview_feedback
        add column if not exists scorecard_criteria jsonb
      `)
    })()
  }
  await feedbackColumnsReady
}

async function ensureRoleColumns() {
  if (!roleColumnsReady) {
    roleColumnsReady = (async () => {
      await db.execute(sql`
        alter table roles
        add column if not exists screening_questions jsonb
      `)
      await db.execute(sql`
        alter table roles
        add column if not exists hiring_manager_id uuid
      `)
    })()
  }
  await roleColumnsReady
}

async function getOwnedCandidate(candidateId: string, userId: string) {
  const candidate = await db.query.candidates.findFirst({
    where: and(eq(candidates.id, candidateId), eq(candidates.userId, userId)),
  })

  if (!candidate) {
    throw new AppError('Candidate not found', 404)
  }

  return candidate
}

async function listRoundConfigs(userId: string, roleName: string) {
  const result = await db.execute(sql`
    select
      id,
      role_name as "roleName",
      round_number as "roundNumber",
      interviewer_name as "interviewerName",
      interviewer_gmail as "interviewerGmail"
    from interview_rounds
    where user_id = ${userId}
    order by role_name asc, round_number asc
  `)

  const rows = result as unknown as Array<{
    id: string
    roleName: string
    roundNumber: number
    interviewerName: string
    interviewerGmail: string
  }>

  const normalizeRole = (value: string) =>
    value
      .trim()
      .toLowerCase()
      .replace(/[_\s-]+/g, '')

  const target = normalizeRole(roleName)
  return rows.filter((round) => normalizeRole(round.roleName) === target)
}

async function getRoundConfig(userId: string, roleName: string, roundNumber: number) {
  const rows = await listRoundConfigs(userId, roleName)
  return rows.find((round) => round.roundNumber === roundNumber) ?? null
}

async function authorizeCandidate(
  candidateId: string,
  userId: string,
  userRole: 'hr' | 'interviewer',
  userEmail: string
) {
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

  return candidate
}

function getInboxStatus(status?: string | null) {
  if (status === 'rejected') return 'rejected'
  if (status === 'pending') return 'inbox'
  return 'pipeline'
}

function serializeCandidate(candidate: typeof candidates.$inferSelect) {
  return {
    ...candidate,
    inboxStatus: getInboxStatus(candidate.status),
    currentStageId:
      candidate.status === 'selected'
        ? 'hired'
        : candidate.currentRound
          ? `round-${candidate.currentRound}`
          : 'inbox',
  }
}

async function enrichCandidates(rows: Array<typeof candidates.$inferSelect>) {
  await ensureFeedbackColumns()
  return Promise.all(
    rows.map(async (candidate) => {
      const [latestInterview] = await db
        .select()
        .from(scheduledInterviews)
        .where(eq(scheduledInterviews.candidateId, candidate.id))
        .orderBy(desc(scheduledInterviews.scheduledStartTime))
        .limit(1)

      const [feedback] = await db
        .select()
        .from(interviewFeedback)
        .where(
          and(
            eq(interviewFeedback.candidateId, candidate.id),
            eq(interviewFeedback.roundNumber, candidate.currentRound || 1)
          )
        )
        .orderBy(desc(interviewFeedback.updatedAt))
        .limit(1)

      return {
        ...serializeCandidate(candidate),
        meetLink: latestInterview?.meetLink ?? null,
        feedbackSubmitted: Boolean(feedback),
      }
    })
  )
}

function mapFitToRating(overallFit?: string) {
  switch (overallFit) {
    case 'excellent_fit':
      return 5
    case 'good_fit':
      return 4
    case 'ok_fit':
      return 3
    case 'poor_fit':
      return 2
    default:
      return null
  }
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
    await ensureFeedbackColumns()
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

    const rows = await db
      .select()
      .from(candidates)
      .where(and(...conditions))
      .orderBy(desc(candidates.createdAt))

    const filtered = rows
      .filter((candidate) =>
        filters.inboxStatus
          ? getInboxStatus(candidate.status) === filters.inboxStatus
          : true
      )

    return enrichCandidates(filtered)
  },

  getCounts: async ({
    userId,
    userRole,
    userEmail,
  }: {
    userId: string
    userRole: 'hr' | 'interviewer'
    userEmail: string
  }) => {
    await ensureFeedbackColumns()
    const rows = await candidateService.list({
      userId,
      userRole,
      userEmail,
      filters: {},
    })

    return {
      inbox: rows.filter((candidate) => candidate.inboxStatus === 'inbox').length,
      pipeline: rows.filter((candidate) => candidate.inboxStatus === 'pipeline').length,
      all: rows.length,
    }
  },

  getPipelineCandidates: async (userId: string, roleName?: string) => {
    const inboxCandidates = await db
      .select()
      .from(candidates)
      .where(
        and(
          eq(candidates.userId, userId),
          eq(candidates.status, 'pending'),
          roleName ? eq(candidates.role, roleName) : undefined
        )
      )
      .orderBy(desc(candidates.createdAt))

    const pipelineCandidates = await db
      .select()
      .from(candidates)
      .where(
        and(
          eq(candidates.userId, userId),
          inArray(candidates.status, ['hr_approved', 'scheduled', 'completed', 'selected']),
          roleName ? eq(candidates.role, roleName) : undefined
        )
      )
      .orderBy(desc(candidates.updatedAt), desc(candidates.createdAt))

    return {
      inboxCandidates: await enrichCandidates(inboxCandidates),
      pipelineCandidates: await enrichCandidates(pipelineCandidates),
    }
  },

  getApprovedByInterviewer: async (userEmail: string) => {
    await ensureFeedbackColumns()

    const result = await db.execute(sql`
      select distinct (metadata->>'candidateId')::uuid as "candidateId"
      from notifications
      where type in ('candidate_advanced', 'candidate_selected')
        and metadata->>'actorName' = ${userEmail}
      order by "candidateId"
    `)

    const candidateIds = (result as unknown as Array<{ candidateId: string }>).map(
      (row) => row.candidateId
    )

    if (candidateIds.length === 0) {
      return []
    }

    const rows = await db
      .select()
      .from(candidates)
      .where(inArray(candidates.id, candidateIds))
      .orderBy(desc(candidates.updatedAt), desc(candidates.createdAt))

    return enrichCandidates(rows)
  },

  getById: async (
    id: string,
    userId: string,
    userRole: 'hr' | 'interviewer',
    userEmail: string
  ) => {
    await ensureFeedbackColumns()
    const candidate = await authorizeCandidate(id, userId, userRole, userEmail)

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
      ...serializeCandidate(candidate),
      latestInterview,
      feedback,
      transcript,
    }
  },

  approve: async (candidateId: string, hrUserId: string) => {
    const candidate = await getOwnedCandidate(candidateId, hrUserId)
    const roundOne = await getRoundConfig(hrUserId, candidate.role, 1)

    if (!roundOne) {
      throw new AppError(
        `No rounds configured for ${candidate.role}. Configure in Settings.`,
        400
      )
    }

    const allRounds = await listRoundConfigs(hrUserId, candidate.role)

    const totalRounds = Math.max(...allRounds.map((round) => round.roundNumber))

    const [updated] = await db
      .update(candidates)
      .set({
        status: 'hr_approved',
        currentRound: 1,
        totalRounds,
        assignedInterviewerEmail: roundOne.interviewerGmail.toLowerCase(),
        roundStatus: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId))
      .returning()

    await slackService.notifyInterviewerAssigned(
      roundOne.interviewerGmail,
      candidate.name || candidate.candidateEmail || 'Candidate',
      candidate.role,
      1
    )

    await activityService.logActivity({
      userId: candidate.userId,
      type: 'candidate_approved',
      message: `HR approved ${candidate.name || candidate.candidateEmail || 'candidate'} for ${candidate.role} Round 1`,
      candidateId: candidate.id,
      actorName: 'HR',
      actorInitials: 'HR',
    })

    return serializeCandidate(updated)
  },

  advanceToNextRound: async (
    candidateId: string,
    _userId: string,
    userEmail: string
  ) => {
    console.log('[INTERVIEWER] Filtering by email:', userEmail)

    const candidate = await db.query.candidates.findFirst({
      where: eq(candidates.id, candidateId),
    })

    if (!candidate) {
      throw new AppError('Candidate not found', 404)
    }

    if (candidate.assignedInterviewerEmail !== userEmail) {
      throw new AppError('Forbidden', 403)
    }

    console.log('[INTERVIEWER] Found candidates:', candidate ? 1 : 0)

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

      await activityService.logActivity({
        userId: selected.userId,
        type: 'candidate_selected',
        message: `${selected.name || selected.candidateEmail || 'Candidate'} was selected for ${selected.role}!`,
        candidateId: selected.id,
        actorName: userEmail,
        actorInitials: userEmail.slice(0, 2).toUpperCase(),
      })

      return { selected: true, candidate: serializeCandidate(selected) }
    }

    const nextRoundConfig = await getRoundConfig(candidate.userId, candidate.role, nextRound)

    if (!nextRoundConfig) {
      throw new AppError('Next round is not configured', 400)
    }

    const [updated] = await db
      .update(candidates)
      .set({
        currentRound: nextRound,
        assignedInterviewerEmail: nextRoundConfig.interviewerGmail.toLowerCase(),
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

    await activityService.logActivity({
      userId: updated.userId,
      type: 'candidate_advanced',
      message: `${updated.name || updated.candidateEmail || 'Candidate'} advanced to Round ${nextRound}`,
      candidateId: updated.id,
      actorName: userEmail,
      actorInitials: userEmail.slice(0, 2).toUpperCase(),
    })

    return serializeCandidate(updated)
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

    return serializeCandidate(created)
  },

  updateFromDrive: async (candidateId: string, input: unknown) => {
    const payload = updateDriveCandidateSchema.parse(input)
    const [updated] = await db
      .update(candidates)
      .set({
        ...payload,
        parsedSkills: payload.parsedData?.skills || [],
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId))
      .returning()

    return serializeCandidate(updated)
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

    return serializeCandidate(updated)
  },

  select: async (candidateId: string, userId: string) => {
    const candidate = await getOwnedCandidate(candidateId, userId)
    const [updated] = await db
      .update(candidates)
      .set({
        status: 'selected',
        roundStatus: 'completed',
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId))
      .returning()

    await activityService.logActivity({
      userId: candidate.userId,
      type: 'candidate_selected',
      message: `${updated.name || updated.candidateEmail || 'Candidate'} was selected for ${updated.role}!`,
      candidateId: updated.id,
      actorName: 'HR',
      actorInitials: 'HR',
    })

    return serializeCandidate(updated)
  },

  action: async (candidateId: string, input: unknown) => {
    const payload = candidateActionSchema.parse(input)
    const candidate = await authorizeCandidate(
      candidateId,
      payload.userId,
      payload.userRole,
      payload.userEmail
    )

    if (payload.action === 'reject') {
      return candidateService.reject(candidateId, candidate.userId)
    }

    if (payload.action === 'interview') {
      return candidateService.approve(candidateId, candidate.userId)
    }

    const [updated] = await db
      .update(candidates)
      .set({
        status: 'pending',
        roundStatus: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId))
      .returning()

    return serializeCandidate(updated)
  },

  moveToStage: async (candidateId: string, userId: string, stageId: string) => {
    const candidate = await getOwnedCandidate(candidateId, userId)

    if (!stageId) {
      throw new AppError('Stage id is required', 400)
    }

    if (stageId === 'hired') {
      return candidateService.select(candidateId, userId)
    }

    if (stageId === 'inbox') {
      const [updated] = await db
        .update(candidates)
        .set({
          status: 'pending',
          currentRound: 1,
          roundStatus: 'pending',
          updatedAt: new Date(),
        })
        .where(eq(candidates.id, candidateId))
        .returning()

      return serializeCandidate(updated)
    }

    if (stageId === 'offer') {
      const [updated] = await db
        .update(candidates)
        .set({
          status: 'completed',
          roundStatus: 'completed',
          updatedAt: new Date(),
        })
        .where(eq(candidates.id, candidateId))
        .returning()

      return serializeCandidate(updated)
    }

    const roundId = stageId.startsWith('round-') ? Number.parseInt(stageId.replace('round-', ''), 10) : NaN
    if (Number.isNaN(roundId)) {
      throw new AppError('Unsupported stage id', 400)
    }

    const roundConfig = await getRoundConfig(userId, candidate.role, roundId)

    const [updated] = await db
      .update(candidates)
      .set({
        status: 'hr_approved',
        currentRound: roundId,
        assignedInterviewerEmail:
          roundConfig?.interviewerGmail?.toLowerCase() ??
          candidate.assignedInterviewerEmail,
        roundStatus: 'pending',
        updatedAt: new Date(),
      })
      .where(eq(candidates.id, candidateId))
      .returning()

    return serializeCandidate(updated)
  },

  getActivity: async (
    candidateId: string,
    userId: string,
    userRole: 'hr' | 'interviewer',
    userEmail: string
  ) => {
    await ensureFeedbackColumns()
    const candidate = await authorizeCandidate(candidateId, userId, userRole, userEmail)

    const interviews = await db
      .select()
      .from(scheduledInterviews)
      .where(eq(scheduledInterviews.candidateId, candidateId))
      .orderBy(desc(scheduledInterviews.scheduledStartTime))

    const feedback = await db.query.interviewFeedback.findMany({
      where: eq(interviewFeedback.candidateId, candidateId),
    })

    const notes = await db.query.notifications.findMany({
      where: and(eq(notifications.userId, candidate.userId), eq(notifications.type, 'candidate_note')),
      orderBy: desc(notifications.createdAt),
    })

    return [
      {
        id: `status-${candidate.id}`,
        type: 'status_change',
        message: `Candidate is currently ${candidate.status?.replace(/_/g, ' ')}`,
        actorName: 'System',
        actorInitials: 'SY',
        timestamp: candidate.updatedAt ?? candidate.createdAt,
        color: 'bg-primary',
      },
      ...interviews.map((item) => ({
        id: `interview-${item.id}`,
        type: 'interview_scheduled',
        message: `Interview scheduled for round ${item.roundNumber}`,
        actorName: item.interviewerEmail,
        actorInitials: item.interviewerEmail.slice(0, 2).toUpperCase(),
        timestamp: item.createdAt,
        color: 'bg-green-500',
      })),
      ...feedback.map((item) => ({
        id: `feedback-${item.id}`,
        type: 'feedback_submitted',
        message: `Feedback submitted for round ${item.roundNumber}`,
        actorName: item.interviewerEmail,
        actorInitials: item.interviewerEmail.slice(0, 2).toUpperCase(),
        timestamp: item.updatedAt,
        color: 'bg-purple-500',
      })),
      ...notes
        .filter((note) => (note.metadata as { candidateId?: string } | null)?.candidateId === candidateId)
        .map((note) => {
          const metadata = (note.metadata as { text?: string; authorName?: string } | null) ?? {}
          return {
            id: `note-${note.id}`,
            type: 'note_added',
            message: metadata.text || note.message,
            actorName: metadata.authorName || 'Team',
            actorInitials: (metadata.authorName || 'TM').slice(0, 2).toUpperCase(),
            timestamp: note.createdAt,
            color: 'bg-blue-500',
          }
        }),
    ].sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  },

  getNotes: async (
    candidateId: string,
    userId: string,
    userRole: 'hr' | 'interviewer',
    userEmail: string
  ) => {
    const candidate = await authorizeCandidate(candidateId, userId, userRole, userEmail)
    const rows = await db.query.notifications.findMany({
      where: and(eq(notifications.userId, candidate.userId), eq(notifications.type, 'candidate_note')),
      orderBy: desc(notifications.createdAt),
    })

    return rows
      .filter((note) => (note.metadata as { candidateId?: string } | null)?.candidateId === candidateId)
      .map((note) => {
        const metadata = (note.metadata as { text?: string; authorName?: string; isPrivate?: boolean } | null) ?? {}
        return {
          id: note.id,
          text: metadata.text || note.message,
          authorName: metadata.authorName || 'Team',
          isPrivate: metadata.isPrivate ?? true,
          createdAt: note.createdAt,
        }
      })
  },

  addNote: async (candidateId: string, input: unknown) => {
    const payload = addNoteSchema.parse(input)
    await authorizeCandidate(candidateId, payload.userId, payload.userRole, payload.userEmail)

    const [created] = await db
      .insert(notifications)
      .values({
        userId: payload.userId,
        type: 'candidate_note',
        message: payload.text,
        metadata: {
          candidateId,
          text: payload.text,
          authorName: payload.userEmail,
          isPrivate: payload.isPrivate ?? true,
        },
      })
      .returning()

    return {
      id: created.id,
      text: payload.text,
      authorName: payload.userEmail,
      isPrivate: payload.isPrivate ?? true,
      createdAt: created.createdAt,
    }
  },

  getScorecard: async (
    candidateId: string,
    userId: string,
    userRole: 'hr' | 'interviewer',
    userEmail: string
  ) => {
    await ensureFeedbackColumns()
    const candidate = await authorizeCandidate(candidateId, userId, userRole, userEmail)
    const [latest] = await db
      .select()
      .from(interviewFeedback)
      .where(
        and(
          eq(interviewFeedback.candidateId, candidateId),
          eq(interviewFeedback.roundNumber, candidate.currentRound || 1)
        )
      )
      .orderBy(desc(interviewFeedback.updatedAt))
      .limit(1)

    if (!latest) {
      return null
    }

    return {
      id: latest.id,
      criteria: latest.scorecardCriteria ?? [],
      overallFit: latest.recommendation ?? '',
    }
  },

  saveScorecard: async (candidateId: string, input: unknown) => {
    await ensureFeedbackColumns()
    const payload = saveScorecardSchema.parse(input)
    const candidate = await authorizeCandidate(candidateId, payload.userId, payload.userRole, payload.userEmail)

    const [saved] = await db
      .insert(interviewFeedback)
      .values({
        candidateId,
        roundNumber: candidate.currentRound || 1,
        interviewerEmail: payload.userEmail,
        overallRating: mapFitToRating(payload.overallFit),
        scorecardCriteria: payload.criteria,
        recommendation: payload.overallFit,
      })
      .onConflictDoUpdate({
        target: [
          interviewFeedback.candidateId,
          interviewFeedback.roundNumber,
          interviewFeedback.interviewerEmail,
        ],
        set: {
          overallRating: mapFitToRating(payload.overallFit),
          scorecardCriteria: payload.criteria,
          recommendation: payload.overallFit,
          updatedAt: new Date(),
        },
      })
      .returning()

    return {
      id: saved.id,
      criteria: payload.criteria,
      overallFit: payload.overallFit,
      createdAt: saved.updatedAt,
    }
  },

  updateRoleScreeningQuestions: async (
    userId: string,
    roleName: string,
    input: unknown
  ) => {
    await ensureRoleColumns()
    const payload = updateRoleScreeningSchema.parse(input)
    const normalized = payload.screeningQuestions.map((question) => ({
      id: question.id || crypto.randomUUID(),
      question: question.question,
      type: question.type || 'yes_no',
      required: question.required ?? false,
    }))

    const [updated] = await db
      .update(roles)
      .set({
        screeningQuestions: normalized,
      })
      .where(and(eq(roles.userId, userId), eq(roles.name, roleName)))
      .returning()

    if (!updated) {
      throw new AppError('Role not found', 404)
    }

    return updated
  },

  getByDriveFileId: async (userId: string, driveFileId: string) =>
    db.query.candidates.findFirst({
      where: and(eq(candidates.userId, userId), eq(candidates.driveFileId, driveFileId)),
    }),

  deleteDriveCandidatesExcept: async (userId: string, keepDriveFileIds: string[]) => {
    const ownedCandidates = await db.query.candidates.findMany({
      where: eq(candidates.userId, userId),
    })

    const staleCandidates = ownedCandidates.filter((candidate) => {
      if (!candidate.driveFileId) {
        return false
      }

      return !keepDriveFileIds.includes(candidate.driveFileId)
    })

    if (staleCandidates.length === 0) {
      return 0
    }

    const staleCandidateIds = staleCandidates.map((candidate) => candidate.id)

    await db.transaction(async (tx) => {
      await tx
        .delete(scheduledInterviews)
        .where(inArray(scheduledInterviews.candidateId, staleCandidateIds))
      await tx
        .delete(interviewFeedback)
        .where(inArray(interviewFeedback.candidateId, staleCandidateIds))
      await tx
        .delete(interviewTranscripts)
        .where(inArray(interviewTranscripts.candidateId, staleCandidateIds))
      await tx.delete(candidates).where(inArray(candidates.id, staleCandidateIds))
    })

    return staleCandidateIds.length
  },
}

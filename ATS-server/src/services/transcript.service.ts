import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { candidates, interviewTranscripts, scheduledInterviews } from '../db/schema'
import { AppError } from '../types'
import { readaiService } from './readai.service'

const manualTranscriptSchema = z.object({
  candidateId: z.string().uuid(),
  roundNumber: z.number().int().positive(),
  transcriptText: z.string().min(1),
  summary: z.string().optional(),
  reportUrl: z.string().url().optional().or(z.literal('')),
  videoUrl: z.string().url().optional().or(z.literal('')),
  userId: z.string().uuid(),
  userEmail: z.string().email(),
})

async function authorizeTranscriptAccess(
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

export const transcriptService = {
  getByRound: async (
    candidateId: string,
    roundNumber: number,
    userId: string,
    userRole: 'hr' | 'interviewer',
    userEmail: string
  ) => {
    await authorizeTranscriptAccess(candidateId, userId, userRole, userEmail)
    const [transcript] = await db
      .select()
      .from(interviewTranscripts)
      .where(
        and(
          eq(interviewTranscripts.candidateId, candidateId),
          eq(interviewTranscripts.roundNumber, roundNumber)
        )
      )
      .orderBy(desc(interviewTranscripts.receivedAt))
      .limit(1)

    return transcript || null
  },

  saveManual: async (input: unknown) => {
    const payload = manualTranscriptSchema.parse(input)
    await authorizeTranscriptAccess(
      payload.candidateId,
      payload.userId,
      'interviewer',
      payload.userEmail
    )

    const [saved] = await db
      .insert(interviewTranscripts)
      .values({
        candidateId: payload.candidateId,
        roundNumber: payload.roundNumber,
        interviewerEmail: payload.userEmail,
        transcriptText: payload.transcriptText,
        transcriptJson: { text: payload.transcriptText },
        summary: payload.summary,
        reportUrl: payload.reportUrl || null,
        videoUrl: payload.videoUrl || null,
        source: 'manual',
      })
      .returning()

    await db
      .update(scheduledInterviews)
      .set({
        transcriptReceived: true,
        status: 'completed',
      })
      .where(
        and(
          eq(scheduledInterviews.candidateId, payload.candidateId),
          eq(scheduledInterviews.roundNumber, payload.roundNumber)
        )
      )

    return saved
  },

  triggerFetch: async (interviewId: string) =>
    readaiService.fetchTranscriptForInterview(interviewId),
}

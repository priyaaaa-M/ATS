import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { candidates, interviewFeedback } from '../db/schema'
import { AppError } from '../types'

const feedbackSchema = z.object({
  candidateId: z.string().uuid(),
  roundNumber: z.number().int().positive(),
  technicalRating: z.number().int().min(1).max(5).optional(),
  communicationRating: z.number().int().min(1).max(5).optional(),
  problemSolvingRating: z.number().int().min(1).max(5).optional(),
  overallRating: z.number().int().min(1).max(5).optional(),
  strengths: z.string().optional(),
  weaknesses: z.string().optional(),
  notes: z.string().optional(),
  recommendation: z.string().optional(),
  userId: z.string().uuid(),
  userEmail: z.string().email(),
})

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

export const feedbackService = {
  submit: async (input: unknown) => {
    const payload = feedbackSchema.parse(input)
    await authorizeCandidate(
      payload.candidateId,
      payload.userId,
      'interviewer',
      payload.userEmail
    )

    const [saved] = await db
      .insert(interviewFeedback)
      .values({
        candidateId: payload.candidateId,
        roundNumber: payload.roundNumber,
        interviewerEmail: payload.userEmail,
        technicalRating: payload.technicalRating,
        communicationRating: payload.communicationRating,
        problemSolvingRating: payload.problemSolvingRating,
        overallRating: payload.overallRating,
        strengths: payload.strengths,
        weaknesses: payload.weaknesses,
        notes: payload.notes,
        recommendation: payload.recommendation,
      })
      .onConflictDoUpdate({
        target: [
          interviewFeedback.candidateId,
          interviewFeedback.roundNumber,
          interviewFeedback.interviewerEmail,
        ],
        set: {
          technicalRating: payload.technicalRating,
          communicationRating: payload.communicationRating,
          problemSolvingRating: payload.problemSolvingRating,
          overallRating: payload.overallRating,
          strengths: payload.strengths,
          weaknesses: payload.weaknesses,
          notes: payload.notes,
          recommendation: payload.recommendation,
          updatedAt: new Date(),
        },
      })
      .returning()

    return saved
  },

  getByRound: async (
    candidateId: string,
    roundNumber: number,
    userId: string,
    userRole: 'hr' | 'interviewer',
    userEmail: string
  ) => {
    await authorizeCandidate(candidateId, userId, userRole, userEmail)
    return db.query.interviewFeedback.findMany({
      where: and(
        eq(interviewFeedback.candidateId, candidateId),
        eq(interviewFeedback.roundNumber, roundNumber)
      ),
    })
  },
}

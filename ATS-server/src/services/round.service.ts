import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { interviewRounds, users } from '../db/schema'
import { AppError } from '../types'

const roundSchema = z.object({
  roleName: z.string().min(1),
  roundNumber: z.number().int().positive(),
  interviewerName: z.string().min(1),
  interviewerGmail: z.string().email(),
})

export const roundService = {
  listByRole: async (userId: string, roleName: string) =>
    db
      .select()
      .from(interviewRounds)
      .where(and(eq(interviewRounds.userId, userId), eq(interviewRounds.roleName, roleName))),

  create: async (userId: string, input: unknown) => {
    const payload = roundSchema.parse(input)
    const owner = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    const [round] = await db
      .insert(interviewRounds)
      .values({
        userId,
        companyId: owner?.companyId || null,
        ...payload,
      })
      .returning()

    return round
  },

  update: async (userId: string, id: string, input: unknown) => {
    const payload = roundSchema.partial().parse(input)
    const [round] = await db
      .update(interviewRounds)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(and(eq(interviewRounds.id, id), eq(interviewRounds.userId, userId)))
      .returning()

    if (!round) {
      throw new AppError('Round not found', 404)
    }

    return round
  },

  remove: async (userId: string, id: string) => {
    const [deleted] = await db
      .delete(interviewRounds)
      .where(and(eq(interviewRounds.id, id), eq(interviewRounds.userId, userId)))
      .returning()

    if (!deleted) {
      throw new AppError('Round not found', 404)
    }

    return { success: true }
  },
}

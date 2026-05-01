import { and, count, desc, eq, or } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { candidates, roleDetails, users } from '../db/schema'
import { AppError } from '../types'

const screeningQuestionSchema = z.object({
  id: z.string().optional(),
  question: z.string().min(1),
  type: z.enum(['text', 'number', 'select', 'boolean']),
  options: z.array(z.string()).optional(),
  required: z.boolean().optional(),
  ideal_answer: z.string().optional(),
  weight: z.number().int().min(1).max(5).optional(),
})

const interviewStageSchema = z.object({
  name: z.string().min(1),
  order: z.number().int().positive(),
  assigned_to: z.array(z.string()).optional(),
  instructions: z.string().optional(),
  auto_advance: z.boolean().optional(),
})

const roleDetailsSchema = z.object({
  companyId: z.string().uuid().nullable().optional(),
  userId: z.string().uuid().nullable().optional(),
  name: z.string().min(1),
  title: z.string().optional().nullable(),
  description: z.string().optional().nullable(),
  hiringGoals: z.string().optional().nullable(),
  salaryMin: z.number().int().nullable().optional(),
  salaryMax: z.number().int().nullable().optional(),
  salaryCurrency: z.string().optional().nullable(),
  expectations: z.string().optional().nullable(),
  activities: z.string().optional().nullable(),
  workTags: z.array(z.string()).optional().nullable(),
  sellingPoints: z.string().optional().nullable(),
  screeningGuide: z.string().optional().nullable(),
  outreachTemplate: z.string().optional().nullable(),
  screeningQuestions: z.array(screeningQuestionSchema).optional().nullable(),
  interviewStages: z.array(interviewStageSchema).optional().nullable(),
  status: z.enum(['draft', 'open', 'paused', 'closed']).optional().nullable(),
  hiringManagerId: z.string().uuid().optional().nullable(),
  assignedRecruiterIds: z.array(z.string().uuid()).optional().nullable(),
})

async function getCompanyScope(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user) {
    throw new AppError('User not found', 404)
  }

  return user
}

async function enrichRoleDetail(record: typeof roleDetails.$inferSelect) {
  const [candidateCountResult, hiringManager] = await Promise.all([
    db
      .select({ count: count() })
      .from(candidates)
      .where(
        or(
          eq(candidates.role, record.title || record.name),
          eq(candidates.role, record.name)
        )
      ),
    record.hiringManagerId
      ? db.query.users.findFirst({
          where: eq(users.id, record.hiringManagerId),
        })
      : Promise.resolve(null),
  ])

  return {
    ...record,
    candidateCount: Number(candidateCountResult[0]?.count || 0),
    hiringManagerName: hiringManager?.name || null,
  }
}

export const roleDetailsService = {
  list: async (userId: string) => {
    const user = await getCompanyScope(userId)
    const records = await db
      .select()
      .from(roleDetails)
      .where(
        user.companyId
          ? or(
              eq(roleDetails.companyId, user.companyId),
              eq(roleDetails.userId, userId)
            )
          : eq(roleDetails.userId, userId)
      )
      .orderBy(desc(roleDetails.createdAt))

    return Promise.all(records.map((record) => enrichRoleDetail(record)))
  },

  getById: async (id: string, userId: string) => {
    const user = await getCompanyScope(userId)
    const record = await db.query.roleDetails.findFirst({
      where: and(
        eq(roleDetails.id, id),
        user.companyId
          ? or(
              eq(roleDetails.companyId, user.companyId),
              eq(roleDetails.userId, userId)
            )
          : eq(roleDetails.userId, userId)
      ),
    })

    if (!record) {
      return null
    }

    return enrichRoleDetail(record)
  },

  create: async (input: unknown, userId: string) => {
    const payload = roleDetailsSchema.parse(input)
    const user = await getCompanyScope(userId)
    const [created] = await db
      .insert(roleDetails)
      .values({
        ...payload,
        userId,
        title: payload.title || payload.name,
        companyId: payload.companyId ?? user.companyId ?? null,
        status: payload.status || 'open',
      })
      .returning()

    return enrichRoleDetail(created)
  },

  update: async (id: string, input: unknown, userId: string) => {
    await roleDetailsService.getById(id, userId)
    const payload = roleDetailsSchema.partial().parse(input)
    const [updated] = await db
      .update(roleDetails)
      .set({
        ...payload,
        updatedAt: new Date(),
      })
      .where(eq(roleDetails.id, id))
      .returning()

    return enrichRoleDetail(updated)
  },

  delete: async (id: string, userId: string) => {
    await roleDetailsService.getById(id, userId)
    await db.delete(roleDetails).where(eq(roleDetails.id, id))
    return { success: true }
  },
}

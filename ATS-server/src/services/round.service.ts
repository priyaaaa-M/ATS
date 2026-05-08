import { and, eq, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { interviewRounds, users } from '../db/schema'
import { AppError } from '../types'

const roundSchema = z.object({
  roleName: z.string().min(1),
  roundNumber: z.number().int().positive(),
  interviewerName: z.string().min(1),
  interviewerGmail: z.string().email(),
  duration: z.string().optional(),
})

let roundColumnsCache: Set<string> | null = null

async function getRoundColumns() {
  if (roundColumnsCache) return roundColumnsCache

  const result = await db.execute(sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = 'interview_rounds'
  `)

  roundColumnsCache = new Set(
    (result as unknown as Array<{ column_name: string }>).map(
      (row) => row.column_name
    )
  )

  return roundColumnsCache
}

async function listRoundsCompat(userId: string, roleName: string) {
  const columns = await getRoundColumns()
  const hasDuration = columns.has('duration')

  const result = await db.execute(
    hasDuration
      ? sql`
          select
            id,
            user_id as "userId",
            company_id as "companyId",
            role_name as "roleName",
            round_number as "roundNumber",
            interviewer_name as "interviewerName",
            interviewer_gmail as "interviewerGmail",
            duration,
            created_at as "createdAt",
            updated_at as "updatedAt"
          from interview_rounds
          where user_id = ${userId} and role_name = ${roleName}
          order by round_number asc
        `
      : sql`
          select
            id,
            user_id as "userId",
            company_id as "companyId",
            role_name as "roleName",
            round_number as "roundNumber",
            interviewer_name as "interviewerName",
            interviewer_gmail as "interviewerGmail",
            null::text as "duration",
            created_at as "createdAt",
            updated_at as "updatedAt"
          from interview_rounds
          where user_id = ${userId} and role_name = ${roleName}
          order by round_number asc
        `
  )

  return result as unknown as Array<Record<string, unknown>>
}

async function getRoundByIdCompat(userId: string, id: string) {
  const columns = await getRoundColumns()
  const hasDuration = columns.has('duration')

  const result = await db.execute(
    hasDuration
      ? sql`
          select
            id,
            user_id as "userId",
            company_id as "companyId",
            role_name as "roleName",
            round_number as "roundNumber",
            interviewer_name as "interviewerName",
            interviewer_gmail as "interviewerGmail",
            duration,
            created_at as "createdAt",
            updated_at as "updatedAt"
          from interview_rounds
          where id = ${id} and user_id = ${userId}
          limit 1
        `
      : sql`
          select
            id,
            user_id as "userId",
            company_id as "companyId",
            role_name as "roleName",
            round_number as "roundNumber",
            interviewer_name as "interviewerName",
            interviewer_gmail as "interviewerGmail",
            null::text as "duration",
            created_at as "createdAt",
            updated_at as "updatedAt"
          from interview_rounds
          where id = ${id} and user_id = ${userId}
          limit 1
        `
  )

  const rows = result as unknown as Array<Record<string, unknown>>
  return rows[0] ?? null
}

export const roundService = {
  listAll: async (userId: string) => {
    const columns = await getRoundColumns()
    const hasDuration = columns.has('duration')
    const result = await db.execute(
      hasDuration
        ? sql`
            select
              id,
              user_id as "userId",
              company_id as "companyId",
              role_name as "roleName",
              round_number as "roundNumber",
              interviewer_name as "interviewerName",
              interviewer_gmail as "interviewerGmail",
              duration,
              created_at as "createdAt",
              updated_at as "updatedAt"
            from interview_rounds
            where user_id = ${userId}
            order by role_name asc, round_number asc
          `
        : sql`
            select
              id,
              user_id as "userId",
              company_id as "companyId",
              role_name as "roleName",
              round_number as "roundNumber",
              interviewer_name as "interviewerName",
              interviewer_gmail as "interviewerGmail",
              null::text as "duration",
              created_at as "createdAt",
              updated_at as "updatedAt"
            from interview_rounds
            where user_id = ${userId}
            order by role_name asc, round_number asc
          `
    )

    return result as unknown as Array<Record<string, unknown>>
  },

  listByRole: async (userId: string, roleName: string) =>
    listRoundsCompat(userId, roleName),

  create: async (userId: string, input: unknown) => {
    const payload = roundSchema.parse(input)
    const columns = await getRoundColumns()
    const owner = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })
    const result = await db.execute(
      columns.has('duration')
        ? sql`
            insert into interview_rounds (
              user_id,
              company_id,
              role_name,
              round_number,
              interviewer_name,
              interviewer_gmail,
              duration
            )
            values (
              ${userId},
              ${owner?.companyId || null},
              ${payload.roleName},
              ${payload.roundNumber},
              ${payload.interviewerName},
              ${payload.interviewerGmail},
              ${payload.duration || null}
            )
            returning id
          `
        : sql`
            insert into interview_rounds (
              user_id,
              company_id,
              role_name,
              round_number,
              interviewer_name,
              interviewer_gmail
            )
            values (
              ${userId},
              ${owner?.companyId || null},
              ${payload.roleName},
              ${payload.roundNumber},
              ${payload.interviewerName},
              ${payload.interviewerGmail}
            )
            returning id
          `
    )

    const rows = result as unknown as Array<{ id: string }>
    return getRoundByIdCompat(userId, rows[0].id)
  },

  update: async (userId: string, id: string, input: unknown) => {
    const payload = roundSchema.partial().parse(input)
    const columns = await getRoundColumns()
    const assignments: ReturnType<typeof sql>[] = [sql`updated_at = ${new Date()}`]

    if (payload.roleName !== undefined) assignments.push(sql`role_name = ${payload.roleName}`)
    if (payload.roundNumber !== undefined) {
      assignments.push(sql`round_number = ${payload.roundNumber}`)
    }
    if (payload.interviewerName !== undefined) {
      assignments.push(sql`interviewer_name = ${payload.interviewerName}`)
    }
    if (payload.interviewerGmail !== undefined) {
      assignments.push(sql`interviewer_gmail = ${payload.interviewerGmail}`)
    }
    if (columns.has('duration') && payload.duration !== undefined) {
      assignments.push(sql`duration = ${payload.duration}`)
    }

    const result = await db.execute(sql`
      update interview_rounds
      set ${sql.join(assignments, sql`, `)}
      where id = ${id} and user_id = ${userId}
      returning id
    `)

    const rows = result as unknown as Array<{ id: string }>
    if (!rows[0]) {
      throw new AppError('Round not found', 404)
    }

    return getRoundByIdCompat(userId, rows[0].id)
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

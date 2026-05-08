import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { candidates, roles, interviewRounds, users } from '../db/schema'
import { AppError } from '../types'
import { driveService } from './drive.service'

let roleColumnsReady: Promise<void> | null = null
let roundColumnsReady: Promise<void> | null = null

async function ensureRoleColumns() {
  if (!roleColumnsReady) {
    roleColumnsReady = (async () => {
      await db.execute(sql`
        alter table roles add column if not exists screening_questions jsonb
      `)
      await db.execute(sql`
        alter table roles add column if not exists hiring_manager_id uuid
      `)
    })()
  }
  await roleColumnsReady
}

async function ensureRoundColumns() {
  if (!roundColumnsReady) {
    roundColumnsReady = (async () => {
      await db.execute(sql`
        alter table interview_rounds add column if not exists duration text
      `)
    })()
  }
  await roundColumnsReady
}

function toRoleTitle(name: string) {
  return name
    .split('-')
    .filter(Boolean)
    .map((part) => part[0]?.toUpperCase() + part.slice(1))
    .join(' ')
}

export const roleService = {
  listByUser: async (userId: string) => {
    await ensureRoleColumns()
    await ensureRoundColumns()
    const baseRoles = await db
      .select({
        id: roles.id,
        name: roles.name,
        userId: roles.userId,
        hiringManagerId: roles.hiringManagerId,
        screeningQuestions: roles.screeningQuestions,
      })
      .from(roles)
      .where(eq(roles.userId, userId))

    const rolesWithMeta = await Promise.all(
      baseRoles.map(async (role) => {
        const roundsResult = await db.execute(sql`
          select count(*)::int as count
          from interview_rounds
          where user_id = ${userId} and role_name = ${role.name}
        `)
        const roundCount =
          (roundsResult as unknown as Array<{ count: number }>)[0]?.count ?? 0

        const relatedCandidates = await db.query.candidates.findMany({
          where: and(eq(candidates.userId, userId), eq(candidates.role, role.name)),
        })

        const avgAts = relatedCandidates.length > 0 ? Math.round(relatedCandidates.reduce((s, c) => s + (c.atsScore || 0), 0) / relatedCandidates.length) : 0

        let hiringManagerName: string | null = null
        if (role.hiringManagerId) {
          const [manager] = await db
            .select({ name: users.name })
            .from(users)
            .where(eq(users.id, role.hiringManagerId))
            .limit(1)
          hiringManagerName = manager?.name || null
        }

        const pipelineCounts = {
          submitted: relatedCandidates.filter((candidate) => candidate.status === 'pending').length,
          inProcess: relatedCandidates.filter((candidate) =>
            ['hr_approved', 'scheduled', 'completed'].includes(candidate.status || '')
          ).length,
          hired: relatedCandidates.filter((candidate) => candidate.status === 'selected').length,
          rejected: relatedCandidates.filter((candidate) => candidate.status === 'rejected').length,
        }

        return {
          ...role,
          title: toRoleTitle(role.name),
          status: 'open' as const,
          roundCount,
          candidateCount: relatedCandidates.length,
          averageAtsScore: avgAts,
          hiringManagerName,
          pipelineCounts,
        }
      })
    )

    return rolesWithMeta
  },

  getScreeningQuestions: async (userId: string, roleName: string) => {
    await ensureRoleColumns()
    const role = await db.query.roles.findFirst({
      where: and(eq(roles.userId, userId), eq(roles.name, roleName)),
    })

    return role?.screeningQuestions ?? []
  },

  syncFromDrive: async (userId: string) => {
    const driveConfig = await driveService.getDriveConfig(userId)
    if (!driveConfig?.driveFolderId) {
      throw new AppError('Drive folder not configured', 400)
    }

    const syncedRoles = await driveService.scanRoleFolders(
      userId,
      driveConfig.driveFolderId
    )

    return {
      success: true,
      count: syncedRoles.length,
      roles: syncedRoles,
    }
  },
}

import { eq } from 'drizzle-orm'
import { db } from '../db'
import { interviewRounds, roles } from '../db/schema'
import { AppError } from '../types'
import { driveService } from './drive.service'

export const roleService = {
  listByUser: async (userId: string) => {
    const savedRoles = await db.select().from(roles).where(eq(roles.userId, userId))
    const roundRoles = await db
      .select({ name: interviewRounds.roleName })
      .from(interviewRounds)
      .where(eq(interviewRounds.userId, userId))

    const seen = new Set(savedRoles.map((role) => role.name))
    const recoveredRoles = roundRoles
      .filter((role) => {
        if (seen.has(role.name)) return false
        seen.add(role.name)
        return true
      })
      .map((role) => ({
        id: `round:${role.name}`,
        name: role.name,
        userId,
        companyId: null,
        createdAt: new Date(),
      }))

    return [...savedRoles, ...recoveredRoles]
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

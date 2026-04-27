import { eq } from 'drizzle-orm'
import { db } from '../db'
import { roles } from '../db/schema'
import { AppError } from '../types'
import { driveService } from './drive.service'

export const roleService = {
  listByUser: async (userId: string) =>
    db.select().from(roles).where(eq(roles.userId, userId)),

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

import { eq } from 'drizzle-orm'
import { config } from '../config'
import { db } from '../db'
import { driveConfigs, syncStates, users } from '../db/schema'
import { AppError } from '../types'
import { candidateService } from './candidate.service'
import { driveService } from './drive.service'
import { parserService } from './parser.service'
import { slackService } from './slack.service'

type SyncFile = {
  fileId: string
  name: string
  webViewLink: string
  mimeType: string
}

async function updateSyncState(
  userId: string,
  values: Partial<typeof syncStates.$inferInsert>
) {
  await db
    .insert(syncStates)
    .values({
      userId,
      ...values,
    })
    .onConflictDoUpdate({
      target: syncStates.userId,
      set: {
        ...values,
        updatedAt: new Date(),
      },
    })
}

async function processSingleResume(userId: string, file: SyncFile, roleName: string) {
  const existing = await candidateService.getByDriveFileId(userId, file.fileId)
  if (existing) {
    return
  }

  if (file.mimeType !== 'application/pdf') {
    throw new AppError(`Unsupported file type for parsing: ${file.mimeType}`, 400)
  }

  const pdfBuffer = await driveService.downloadFile(userId, file.fileId)
  const parsed = await parserService.parsePdf(pdfBuffer, roleName)
  const owner = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  const candidate = await candidateService.create({
    userId,
    companyId: owner?.companyId || null,
    role: roleName,
    name: parsed.name,
    candidateEmail: parsed.email,
    phone: parsed.phone,
    resumeUrl: file.webViewLink,
    driveFileId: file.fileId,
    parsedData: parsed.sections,
    atsScore: parsed.atsScore,
  })

  await slackService.notifyNewCandidate(
    userId,
    candidate.name || file.name,
    roleName
  )
}

export const syncService = {
  ensureCanRun: async (userId: string) =>
    (await db.query.syncStates.findFirst({
      where: eq(syncStates.userId, userId),
    })) || {
      isSyncRunning: false,
      totalProcessed: 0,
      totalFailed: 0,
    },

  getStatus: async (userId: string) =>
    (await db.query.syncStates.findFirst({
      where: eq(syncStates.userId, userId),
    })) || {
      isSyncRunning: false,
      totalProcessed: 0,
      totalFailed: 0,
    },

  runDriveSync: async (userId: string) => {
    await updateSyncState(userId, {
      isSyncRunning: true,
      lastSyncStartedAt: new Date(),
      lastSyncError: null,
      totalProcessed: 0,
      totalFailed: 0,
    })

    try {
      const driveConfig = await driveService.getDriveConfig(userId)
      if (!driveConfig?.driveFolderId) {
        throw new AppError('Drive not configured', 400)
      }

      const roleFolders = await driveService.scanRoleFolders(
        userId,
        driveConfig.driveFolderId
      )

      let totalProcessed = 0
      let totalFailed = 0

      for (const roleFolder of roleFolders) {
        const files = await driveService.getFilesInFolder(userId, roleFolder.folderId)

        for (let index = 0; index < files.length; index += config.sync.batchSize) {
          const batch = files.slice(index, index + config.sync.batchSize)
          const results = await Promise.allSettled(
            batch.map((file) => processSingleResume(userId, file, roleFolder.name))
          )

          for (const result of results) {
            if (result.status === 'fulfilled') {
              totalProcessed += 1
            } else {
              totalFailed += 1
              console.error('[SYNC] Failed to process file:', result.reason)
            }
          }

          await updateSyncState(userId, {
            isSyncRunning: true,
            totalProcessed,
            totalFailed,
          })

          await new Promise((resolve) =>
            setTimeout(resolve, config.sync.batchDelayMs)
          )
        }
      }

      await updateSyncState(userId, {
        isSyncRunning: false,
        lastSyncCompletedAt: new Date(),
        totalProcessed,
        totalFailed,
      })

      await db
        .update(driveConfigs)
        .set({
          lastSyncAt: new Date(),
          updatedAt: new Date(),
        })
        .where(eq(driveConfigs.userId, userId))
    } catch (error) {
      await updateSyncState(userId, {
        isSyncRunning: false,
        lastSyncError: error instanceof Error ? error.message : 'Unknown sync error',
      })

      throw error
    }
  },
}

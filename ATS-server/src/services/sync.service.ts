import { eq } from 'drizzle-orm'
import { config } from '../config'
import { db } from '../db'
import { driveConfigs, syncStates, users } from '../db/schema'
import { AppError } from '../types'
import { activityService } from './activity.service'
import { candidateService } from './candidate.service'
import { driveService } from './drive.service'
import { importBatchService } from './importBatch.service'
import { parserService } from './parser.service'
import { sourceService } from './source.service'
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

async function processSingleResume(
  userId: string,
  file: SyncFile,
  roleName: string,
  sourceName: string,
  importBatchId?: string
) {
  const existing = await candidateService.getByDriveFileId(userId, file.fileId)

  if (file.mimeType !== 'application/pdf') {
    throw new AppError(`Unsupported file type for parsing: ${file.mimeType}`, 400)
  }

  const pdfBuffer = await driveService.downloadFile(userId, file.fileId)
  const parsed = await parserService.parsePdf(pdfBuffer, roleName)
  const owner = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  const payload = {
    userId,
    companyId: owner?.companyId || null,
    role: roleName,
    source: sourceName,
    name: parsed.name,
    candidateEmail: parsed.email,
    phone: parsed.phone,
    resumeUrl: file.webViewLink,
    driveFileId: file.fileId,
    parsedData: {
      ...parsed.sections,
      importMetadata: {
        importMethod: 'google_drive',
        importBatchId,
        sourceName,
        originalFilename: file.name,
      },
    },
    atsScore: parsed.atsScore,
  }

  if (existing) {
    await candidateService.updateFromDrive(existing.id, {
      name: parsed.name || undefined,
      candidateEmail: parsed.email || undefined,
      phone: parsed.phone || undefined,
      resumeUrl: file.webViewLink,
      source: sourceName,
      parsedData: {
        ...parsed.sections,
        importMetadata: {
          importMethod: 'google_drive',
          importBatchId,
          sourceName,
          originalFilename: file.name,
        },
      },
      atsScore: parsed.atsScore,
    })
    return
  }

  const candidate = await candidateService.create(payload)

  await slackService.notifyNewCandidate(
    userId,
    candidate.name || file.name,
    roleName
  )

  await activityService.logActivity({
    userId,
    type: 'resume_parsed',
    message: `System parsed ${candidate.name || file.name}'s resume from Drive`,
    candidateId: candidate.id,
    actorName: 'System',
    actorInitials: 'SY',
  })
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

  validateDriveStructure: async (userId: string) => {
    const driveConfig = await driveService.getDriveConfig(userId)
    if (!driveConfig?.driveFolderId) {
      throw new AppError('Drive not configured', 400)
    }

    const importFolders = await driveService.scanImportFolders(
      userId,
      driveConfig.driveFolderId
    )

    const issues: Array<{ type: string; message: string }> = []
    if (importFolders.length === 0) {
      issues.push({
        type: 'missing_import_folders',
        message: 'No role/source folders were found under rules/.',
      })
    }

    const legacyFolders = importFolders.filter(
      (folder) => folder.sourceName === 'drive-import'
    )
    if (legacyFolders.length > 0) {
      issues.push({
        type: 'legacy_role_folder',
        message:
          'Some role folders contain resumes directly. Move resumes into source folders like on-campus or referral.',
      })
    }

    const folders = await Promise.all(
      importFolders.map(async (folder) => {
        const files = await driveService.getFilesInFolder(userId, folder.folderId)
        return {
          roleName: folder.roleName,
          sourceName: folder.sourceName,
          sourceFolderName: folder.sourceFolderName,
          resumeCount: files.length,
        }
      })
    )

    return {
      valid: issues.length === 0,
      issues,
      folders,
    }
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

      const importFolders = await driveService.scanImportFolders(
        userId,
        driveConfig.driveFolderId
      )
      const owner = await db.query.users.findFirst({
        where: eq(users.id, userId),
      })
      const importBatch = await importBatchService.create({
        companyId: owner?.companyId || null,
        userId,
        importMethod: 'google_drive',
        status: 'importing',
        totalFiles: 0,
      })

      let totalProcessed = 0
      let totalFailed = 0
      let totalFiles = 0
      const seenDriveFileIds: string[] = []

      for (const importFolder of importFolders) {
        if (owner?.companyId) {
          await sourceService.create(owner.companyId, userId, {
            name: importFolder.sourceFolderName,
          })
        }

        const files = await driveService.getFilesInFolder(userId, importFolder.folderId)
        totalFiles += files.length
        await importBatchService.update(importBatch.id, { totalFiles })
        seenDriveFileIds.push(...files.map((file) => file.fileId))

        for (let index = 0; index < files.length; index += config.sync.batchSize) {
          const fileBatch = files.slice(index, index + config.sync.batchSize)
          const results = await Promise.allSettled(
            fileBatch.map((file) =>
              processSingleResume(
                userId,
                file,
                importFolder.roleName,
                importFolder.sourceName,
                importBatch.id
              )
            )
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
          await importBatchService.update(importBatch.id, {
            totalFiles,
            successfulCount: totalProcessed,
            failedCount: totalFailed,
          })

          await new Promise((resolve) =>
            setTimeout(resolve, config.sync.batchDelayMs)
          )
        }
      }

      const removedCount = await candidateService.deleteDriveCandidatesExcept(
        userId,
        seenDriveFileIds
      )

      if (removedCount > 0) {
        console.log(
          `[SYNC] Removed ${removedCount} stale candidate(s) for user ${userId}`
        )
      }

      await updateSyncState(userId, {
        isSyncRunning: false,
        lastSyncCompletedAt: new Date(),
        totalProcessed,
        totalFailed,
      })
      await importBatchService.update(importBatch.id, {
        status: totalFailed > 0 ? 'completed_with_errors' : 'completed',
        totalFiles,
        successfulCount: totalProcessed,
        failedCount: totalFailed,
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

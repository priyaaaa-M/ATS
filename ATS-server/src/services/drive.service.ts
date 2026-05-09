import { and, eq, inArray } from 'drizzle-orm'
import { google } from 'googleapis'
import { db } from '../db'
import { driveConfigs, interviewRounds, roles, users } from '../db/schema'
import { AppError } from '../types'
import { createOAuth2Client } from './google.service'

const allowedMimeTypes = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]

function normalizeRoleName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

function normalizeSourceName(name: string) {
  return name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

async function getAuthedDrive(userId: string) {
  const user = await db.query.users.findFirst({
    where: eq(users.id, userId),
  })

  if (!user?.googleRefreshToken && !user?.googleAccessToken) {
    throw new AppError('Google Drive not connected for this user', 400)
  }

  const auth = createOAuth2Client({
    accessToken: user.googleAccessToken,
    refreshToken: user.googleRefreshToken,
  })

  auth.on('tokens', async (tokens) => {
    await db
      .update(users)
      .set({
        googleAccessToken: tokens.access_token || user.googleAccessToken,
        googleRefreshToken: tokens.refresh_token || user.googleRefreshToken,
        updatedAt: new Date(),
      })
      .where(eq(users.id, userId))
  })

  await auth.getAccessToken()
  return google.drive({ version: 'v3', auth })
}

export const driveService = {
  getDriveConfig: async (userId: string) =>
    db.query.driveConfigs.findFirst({
      where: eq(driveConfigs.userId, userId),
    }),

  scanRoleFolders: async (userId: string, rootFolderId: string) => {
    const drive = await getAuthedDrive(userId)
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    const rulesFolder = await drive.files.list({
      q: `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and name = 'rules' and trashed = false`,
      fields: 'files(id,name)',
      pageSize: 1,
    })

    const rules = rulesFolder.data.files?.[0]
    if (!rules?.id) {
      throw new AppError("Drive root folder must contain a 'rules' subfolder", 400)
    }

    const folders = await drive.files.list({
      q: `'${rules.id}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id,name)',
      pageSize: 500,
    })

    const result =
      folders.data.files?.map((folder) => ({
        name: normalizeRoleName(folder.name || 'unnamed-role'),
        folderId: folder.id || '',
      })) || []

    const roleNames = result.map((roleFolder) => roleFolder.name)
    const existingRoles = await db
      .select()
      .from(roles)
      .where(eq(roles.userId, userId))

    const staleRoleNames = existingRoles
      .map((role) => role.name)
      .filter((roleName) => !roleNames.includes(roleName))

    await db.transaction(async (tx) => {
      if (staleRoleNames.length > 0) {
        await tx
          .delete(interviewRounds)
          .where(
            and(
              eq(interviewRounds.userId, userId),
              inArray(interviewRounds.roleName, staleRoleNames)
            )
          )
        await tx
          .delete(roles)
          .where(
            and(eq(roles.userId, userId), inArray(roles.name, staleRoleNames))
          )
      }

      for (const roleFolder of result) {
        await tx
          .insert(roles)
          .values({
            companyId: user?.companyId || null,
            userId,
            name: roleFolder.name,
          })
          .onConflictDoNothing()
      }
    })

    return result
  },

  scanImportFolders: async (userId: string, rootFolderId: string) => {
    const drive = await getAuthedDrive(userId)
    const roleFolders = await driveService.scanRoleFolders(userId, rootFolderId)
    const imports: Array<{
      roleName: string
      sourceName: string
      folderId: string
      sourceFolderName: string
    }> = []

    for (const roleFolder of roleFolders) {
      const sourceFolders = await drive.files.list({
        q: `'${roleFolder.folderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
        fields: 'files(id,name)',
        pageSize: 500,
      })

      const folders = sourceFolders.data.files || []
      if (folders.length === 0) {
        imports.push({
          roleName: roleFolder.name,
          sourceName: 'drive-import',
          folderId: roleFolder.folderId,
          sourceFolderName: 'Drive Import',
        })
        continue
      }

      for (const folder of folders) {
        if (!folder.id) continue
        imports.push({
          roleName: roleFolder.name,
          sourceName: normalizeSourceName(folder.name || 'unnamed-source'),
          folderId: folder.id,
          sourceFolderName: folder.name || 'Unnamed source',
        })
      }
    }

    return imports
  },

  getFilesInFolder: async (userId: string, folderId: string) => {
    const drive = await getAuthedDrive(userId)
    const response = await drive.files.list({
      q: `'${folderId}' in parents and trashed = false`,
      fields: 'files(id,name,webViewLink,mimeType)',
      pageSize: 1000,
    })

    return (
      response.data.files
        ?.filter((file) => allowedMimeTypes.includes(file.mimeType || ''))
        .map((file) => ({
          fileId: file.id || '',
          name: file.name || 'Unnamed file',
          webViewLink: file.webViewLink || '',
          mimeType: file.mimeType || '',
        })) || []
    )
  },

  downloadFile: async (userId: string, fileId: string) => {
    const drive = await getAuthedDrive(userId)
    const response = await drive.files.get(
      {
        fileId,
        alt: 'media',
      },
      {
        responseType: 'arraybuffer',
      }
    )

    return Buffer.from(response.data as ArrayBuffer)
  },
}

import { and, eq } from 'drizzle-orm'
import { google } from 'googleapis'
import { db } from '../db'
import { driveConfigs, roles, users } from '../db/schema'
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

    const folders = await drive.files.list({
      q: `'${rootFolderId}' in parents and mimeType = 'application/vnd.google-apps.folder' and trashed = false`,
      fields: 'files(id,name)',
      pageSize: 500,
    })

    const result =
      folders.data.files?.map((folder) => ({
        name: normalizeRoleName(folder.name || 'unnamed-role'),
        folderId: folder.id || '',
      })) || []

    for (const roleFolder of result) {
      await db
        .insert(roles)
        .values({
          companyId: user?.companyId || null,
          userId,
          name: roleFolder.name,
        })
        .onConflictDoNothing()
    }

    return result
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

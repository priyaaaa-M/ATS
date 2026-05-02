import { eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { companies, driveConfigs } from '../db/schema'
import { AppError } from '../types'

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().url().optional().or(z.literal('')),
  brandColor: z.string().min(4).optional(),
  slackWebhookUrl: z.string().url().optional().or(z.literal('')),
  industry: z.string().optional(),
  size: z.string().optional(),
  description: z.string().optional(),
  website: z.string().url().optional().or(z.literal('')),
})

const driveConfigSchema = z.object({
  driveFolderLink: z.string().url(),
})

function extractDriveFolderId(link: string) {
  const match =
    link.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] ||
    link.match(/[?&]id=([a-zA-Z0-9_-]+)/)?.[1]
  return match || null
}

export const companyService = {
  getProfile: async (companyId: string) => {
    const company = await db.query.companies.findFirst({
      where: eq(companies.id, companyId),
    })

    if (!company) {
      throw new AppError('Company not found', 404)
    }

    return company
  },

  updateProfile: async (companyId: string, input: unknown) => {
    const payload = updateCompanySchema.parse(input)
    const [company] = await db
      .update(companies)
      .set({
        ...payload,
        logoUrl: payload.logoUrl || null,
        slackWebhookUrl: payload.slackWebhookUrl || null,
        website: payload.website || null,
        updatedAt: new Date(),
      })
      .where(eq(companies.id, companyId))
      .returning()

    if (!company) {
      throw new AppError('Company not found', 404)
    }

    return company
  },

  getDriveConfig: async (userId: string) =>
    db.query.driveConfigs.findFirst({
      where: eq(driveConfigs.userId, userId),
    }),

  saveDriveConfig: async (
    userId: string,
    companyId: string | null,
    input: unknown
  ) => {
    const payload = driveConfigSchema.parse(input)
    const driveFolderId = extractDriveFolderId(payload.driveFolderLink)

    const [saved] = await db
      .insert(driveConfigs)
      .values({
        userId,
        companyId,
        driveFolderLink: payload.driveFolderLink,
        driveFolderId,
      })
      .onConflictDoUpdate({
        target: driveConfigs.userId,
        set: {
          driveFolderLink: payload.driveFolderLink,
          driveFolderId,
          updatedAt: new Date(),
        },
      })
      .returning()

    return saved
  },
}

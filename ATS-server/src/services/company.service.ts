import { eq, inArray, sql } from 'drizzle-orm'
import { z } from 'zod'
import { db, supabaseAdmin } from '../db'
import {
  candidates,
  companies,
  driveConfigs,
  interviewFeedback,
  interviewTranscripts,
  roles,
  scheduledInterviews,
  syncStates,
} from '../db/schema'
import { AppError } from '../types'

const updateCompanySchema = z.object({
  name: z.string().min(1).optional(),
  logoUrl: z.string().optional().or(z.literal('')),
  brandColor: z.string().min(4).optional(),
  slackWebhookUrl: z.string().url().optional().or(z.literal('')),
  slackChannel: z.string().optional().or(z.literal('')),
  slackNotifyEvents: z.array(z.string()).optional(),
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

let companyColumnsCache: Set<string> | null = null

async function getCompanyColumns() {
  if (companyColumnsCache) return companyColumnsCache

  const result = await db.execute(sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = 'companies'
  `)

  companyColumnsCache = new Set(
    (result as unknown as Array<{ column_name: string }>).map(
      (row) => row.column_name
    )
  )

  return companyColumnsCache
}

async function getCompanyProfileCompat(companyId: string) {
  const columns = await getCompanyColumns()
  const hasSlackChannel = columns.has('slack_channel')
  const hasSlackNotifyEvents = columns.has('slack_notify_events')

  const result = await db.execute(
    hasSlackChannel && hasSlackNotifyEvents
      ? sql`
          select
            id,
            name,
            logo_url as "logoUrl",
            brand_color as "brandColor",
            slack_webhook_url as "slackWebhookUrl",
            slack_channel as "slackChannel",
            slack_notify_events as "slackNotifyEvents",
            industry,
            size,
            description,
            website,
            created_at as "createdAt",
            updated_at as "updatedAt"
          from companies
          where id = ${companyId}
          limit 1
        `
      : sql`
          select
            id,
            name,
            logo_url as "logoUrl",
            brand_color as "brandColor",
            slack_webhook_url as "slackWebhookUrl",
            null::text as "slackChannel",
            null::json as "slackNotifyEvents",
            industry,
            size,
            description,
            website,
            created_at as "createdAt",
            updated_at as "updatedAt"
          from companies
          where id = ${companyId}
          limit 1
        `
  )

  const rows = result as unknown as Array<Record<string, unknown>>
  return rows[0] ?? null
}

async function uploadCompanyLogo(companyId: string, logoUrl?: string) {
  if (!logoUrl || !logoUrl.startsWith('data:')) {
    return logoUrl || null
  }

  const match = logoUrl.match(/^data:(image\/(?:png|svg\+xml));base64,(.+)$/)
  if (!match) {
    throw new AppError('Logo must be a PNG or SVG image', 400)
  }

  const mimeType = match[1]
  const base64Data = match[2]
  const extension = mimeType === 'image/png' ? 'png' : 'svg'
  const filePath = `company-logos/${companyId}-${Date.now()}.${extension}`
  const fileBuffer = Buffer.from(base64Data, 'base64')

  const { error } = await supabaseAdmin.storage
    .from('company-assets')
    .upload(filePath, fileBuffer, {
      contentType: mimeType,
      upsert: true,
    })

  if (error) {
    if (error.message.toLowerCase().includes('bucket not found')) {
      console.warn(
        '[COMPANY] company-assets bucket not found. Falling back to inline logo data URL.'
      )
      return logoUrl
    }

    throw new AppError(`Failed to upload logo: ${error.message}`, 500)
  }

  const { data } = supabaseAdmin.storage.from('company-assets').getPublicUrl(filePath)
  return data.publicUrl
}

async function clearImportedDriveData(userId: string) {
  await db.transaction(async (tx) => {
    const ownedCandidates = await tx
      .select({ id: candidates.id })
      .from(candidates)
      .where(eq(candidates.userId, userId))

    const candidateIds = ownedCandidates.map((candidate) => candidate.id)

    if (candidateIds.length > 0) {
      await tx
        .delete(scheduledInterviews)
        .where(inArray(scheduledInterviews.candidateId, candidateIds))
      await tx
        .delete(interviewFeedback)
        .where(inArray(interviewFeedback.candidateId, candidateIds))
      await tx
        .delete(interviewTranscripts)
        .where(inArray(interviewTranscripts.candidateId, candidateIds))
      await tx.delete(candidates).where(eq(candidates.userId, userId))
    }

    await tx.delete(roles).where(eq(roles.userId, userId))
  })
}

export const companyService = {
  getProfile: async (companyId: string) => {
    const company = await getCompanyProfileCompat(companyId)

    if (!company) {
      throw new AppError('Company not found', 404)
    }

    return company
  },

  updateProfile: async (companyId: string, input: unknown) => {
    const payload = updateCompanySchema.parse(input)
    const uploadedLogoUrl = await uploadCompanyLogo(companyId, payload.logoUrl)
    const columns = await getCompanyColumns()
    const updateData: Record<string, unknown> = {
      name: payload.name,
      logoUrl: uploadedLogoUrl,
      brandColor: payload.brandColor,
      slackWebhookUrl: payload.slackWebhookUrl || null,
      industry: payload.industry,
      size: payload.size,
      description: payload.description,
      website: payload.website || null,
      updatedAt: new Date(),
    }

    if (columns.has('slack_channel')) {
      updateData.slackChannel = payload.slackChannel || null
    }

    if (columns.has('slack_notify_events')) {
      updateData.slackNotifyEvents = payload.slackNotifyEvents || null
    }

    const [updated] = await db
      .update(companies)
      .set(updateData)
      .where(eq(companies.id, companyId))
      .returning({ id: companies.id })

    if (!updated) {
      throw new AppError('Company not found', 404)
    }

    const company = await getCompanyProfileCompat(companyId)

    if (!company) {
      throw new AppError('Company not found', 404)
    }

    return company
  },

  getDriveConfig: async (userId: string) => {
    const driveConfig = await db.query.driveConfigs.findFirst({
      where: eq(driveConfigs.userId, userId),
    })

    if (!driveConfig?.companyId) {
      return driveConfig
    }

    const company = await getCompanyProfileCompat(driveConfig.companyId)

    return {
      ...driveConfig,
      slackWebhookUrl: String(company?.slackWebhookUrl || ''),
      slackChannel: String(company?.slackChannel || ''),
      slackNotifyEvents: Array.isArray(company?.slackNotifyEvents)
        ? company.slackNotifyEvents
        : [],
    }
  },

  saveDriveConfig: async (
    userId: string,
    companyId: string,
    input: unknown
  ) => {
    const payload = driveConfigSchema.parse(input)
    const driveFolderId = extractDriveFolderId(payload.driveFolderLink)
    if (!driveFolderId) {
      throw new AppError(
        'Invalid Google Drive folder link. Please paste a direct folder URL.',
        400
      )
    }

    const existing = await db.query.driveConfigs.findFirst({
      where: eq(driveConfigs.userId, userId),
    })
    const hasDriveRootChanged =
      Boolean(existing) &&
      (
        existing?.driveFolderId !== driveFolderId ||
        existing?.driveFolderLink !== payload.driveFolderLink
      )

    if (hasDriveRootChanged) {
      await clearImportedDriveData(userId)
      await db
        .insert(syncStates)
        .values({
          userId,
          companyId,
          isSyncRunning: false,
          lastSyncStartedAt: null,
          lastSyncCompletedAt: null,
          lastSyncError: null,
          totalProcessed: 0,
          totalFailed: 0,
        })
        .onConflictDoUpdate({
          target: syncStates.userId,
          set: {
            companyId,
            isSyncRunning: false,
            lastSyncStartedAt: null,
            lastSyncCompletedAt: null,
            lastSyncError: null,
            totalProcessed: 0,
            totalFailed: 0,
            updatedAt: new Date(),
          },
        })
    }

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
          lastSyncAt: hasDriveRootChanged
            ? null
            : (existing ? existing.lastSyncAt : null),
          updatedAt: new Date(),
        },
      })
      .returning()

    return saved
  },
}

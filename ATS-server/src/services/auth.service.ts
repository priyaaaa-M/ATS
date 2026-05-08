import { and, eq, sql } from 'drizzle-orm'
import { db } from '../db'
import { companies, invites, users } from '../db/schema'
import { AppError } from '../types'
import { googleService } from './google.service'

let companySchemaCache: {
  hasSlackChannel: boolean
  hasSlackNotifyEvents: boolean
} | null = null

async function getCompanySchemaFlags() {
  if (companySchemaCache) return companySchemaCache

  const result = await db.execute(sql`
    select column_name
    from information_schema.columns
    where table_schema = 'public' and table_name = 'companies'
  `)

  const columnNames = new Set(
    (result as unknown as Array<{ column_name: string }>).map(
      (row) => row.column_name
    )
  )

  companySchemaCache = {
    hasSlackChannel: columnNames.has('slack_channel'),
    hasSlackNotifyEvents: columnNames.has('slack_notify_events'),
  }

  return companySchemaCache
}

async function getCompanyByIdCompat(companyId: string) {
  const schemaFlags = await getCompanySchemaFlags()

  const companyQuery = schemaFlags.hasSlackChannel && schemaFlags.hasSlackNotifyEvents
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

  const result = await db.execute(companyQuery)
  const rows = result as unknown as Array<Record<string, unknown>>
  return rows[0] ?? null
}

function deriveCompanyName(email: string) {
  const domain = email.split('@')[1] || 'company'
  const name = domain.split('.')[0] || 'company'
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

export const authService = {
  handleGoogleCallback: async (code: string, inviteToken?: string) => {
    const googleUser = await googleService.exchangeCode(code)
    const googleUserEmail = googleUser.email?.toLowerCase()

    if (!googleUserEmail) {
      throw new AppError('Google account email not available', 400)
    }

    const invite =
      inviteToken &&
      (await db.query.invites.findFirst({
        where: and(eq(invites.token, inviteToken), eq(invites.used, false)),
      }))

    if (invite && invite.email.toLowerCase() !== googleUserEmail) {
      throw new AppError(
        `Invite was for ${invite.email} but you logged in as ${googleUserEmail}. Please use the correct Google account.`,
        400
      )
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, googleUserEmail),
    })

    if (existingUser) {
      const [updatedUser] = await db
        .update(users)
        .set({
          name: googleUser.name || existingUser.name,
          googleEmail: googleUser.email,
          googleAccessToken: googleUser.accessToken || existingUser.googleAccessToken,
          googleRefreshToken:
            googleUser.refreshToken || existingUser.googleRefreshToken,
          updatedAt: new Date(),
        })
        .where(eq(users.id, existingUser.id))
        .returning()

      return { user: updatedUser }
    }

    if (
      invite &&
      invite.email.toLowerCase() === googleUserEmail &&
      invite.expiresAt > new Date()
    ) {
      const [newInterviewer] = await db
        .insert(users)
        .values({
          companyId: invite.companyId || null,
          name: googleUser.name,
          email: googleUserEmail,
          role: 'interviewer',
          googleAccessToken: googleUser.accessToken,
          googleRefreshToken: googleUser.refreshToken,
          googleEmail: googleUser.email,
          invitedByUserId: invite.createdByUserId || null,
        })
        .returning()

      await db
        .update(invites)
        .set({ used: true })
        .where(eq(invites.id, invite.id))

      return { user: newInterviewer }
    }

    const [company] = await db
      .insert(companies)
      .values({
        name: deriveCompanyName(googleUser.email),
      })
      .returning()

    const [newHr] = await db
      .insert(users)
      .values({
        companyId: company.id,
        name: googleUser.name,
        email: googleUserEmail,
        role: 'hr',
        googleAccessToken: googleUser.accessToken,
        googleRefreshToken: googleUser.refreshToken,
        googleEmail: googleUser.email,
      })
      .returning()

    return { user: newHr }
  },

  getUserById: async (userId: string) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const company = user.companyId ? await getCompanyByIdCompat(user.companyId) : null

    return {
      ...user,
      company,
    }
  },
}

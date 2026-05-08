import { eq, sql } from 'drizzle-orm'
import { google } from 'googleapis'
import { db } from '../db'
import { users } from '../db/schema'
import { AppError } from '../types'
import { createOAuth2Client } from './google.service'

function encodeMessage(message: string) {
  return Buffer.from(message)
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=+$/, '')
}

function buildInviteEmail(params: {
  fromEmail: string
  toEmail: string
  companyName: string
  roleName: string
  roundNumber: number
  inviteLink: string
  expiresInDays: number
}) {
  const subject = `Interview invitation for ${params.roleName} - Round ${params.roundNumber}`
  const html = `
    <div style="font-family:Arial,sans-serif;line-height:1.5;color:#1f2937">
      <p>Hello,</p>
      <p>You have been invited by <strong>${params.companyName}</strong> to join interview round ${params.roundNumber} for the <strong>${params.roleName}</strong> role.</p>
      <p>Please open the invite below and sign in with your Google account:</p>
      <p><a href="${params.inviteLink}">${params.inviteLink}</a></p>
      <p>This invite expires in ${params.expiresInDays} days.</p>
      <p>Best,<br/>${params.companyName} ATS</p>
    </div>
  `.trim()
  const text = [
    'Hello,',
    '',
    `${params.companyName} invited you to interview round ${params.roundNumber} for ${params.roleName}.`,
    '',
    `Open your invite: ${params.inviteLink}`,
    '',
    `This invite expires in ${params.expiresInDays} days.`,
  ].join('\n')

  return [
    `From: ${params.fromEmail}`,
    `To: ${params.toEmail}`,
    `Subject: ${subject}`,
    'MIME-Version: 1.0',
    'Content-Type: text/html; charset=UTF-8',
    '',
    html,
    '',
    `<!-- ${text} -->`,
  ].join('\r\n')
}

async function getCompanyName(companyId: string) {
  const result = await db.execute(sql`
    select name
    from companies
    where id = ${companyId}
    limit 1
  `)

  const rows = result as unknown as Array<{ name: string | null }>
  return rows[0]?.name || 'ATS'
}

export const mailService = {
  sendInviteEmail: async (params: {
    createdByUserId: string
    toEmail: string
    roleName: string
    roundNumber: number
    inviteLink: string
    companyId: string
    expiresInDays: number
  }) => {
    const sender = await db.query.users.findFirst({
      where: eq(users.id, params.createdByUserId),
    })

    if (!sender?.email) {
      throw new AppError('Invite sender not found', 404)
    }

    if (!sender.googleAccessToken && !sender.googleRefreshToken) {
      throw new AppError('Google account is not connected for email sending', 400)
    }

    const companyName = await getCompanyName(params.companyId)

    const auth = createOAuth2Client({
      accessToken: sender.googleAccessToken,
      refreshToken: sender.googleRefreshToken,
    })

    auth.on('tokens', async (tokens) => {
      await db
        .update(users)
        .set({
          googleAccessToken: tokens.access_token || sender.googleAccessToken,
          googleRefreshToken: tokens.refresh_token || sender.googleRefreshToken,
          updatedAt: new Date(),
        })
        .where(eq(users.id, sender.id))
    })

    const gmail = google.gmail({ version: 'v1', auth })
    const raw = encodeMessage(
      buildInviteEmail({
        fromEmail: sender.email,
        toEmail: params.toEmail,
        companyName,
        roleName: params.roleName,
        roundNumber: params.roundNumber,
        inviteLink: params.inviteLink,
        expiresInDays: params.expiresInDays,
      })
    )

    try {
      await gmail.users.messages.send({
        userId: 'me',
        requestBody: { raw },
      })
    } catch (error: any) {
      const message =
        error?.response?.data?.error?.message ||
        error?.message ||
        'Failed to send invite email'

      if (
        String(message).toLowerCase().includes('insufficient') ||
        String(message).toLowerCase().includes('scope')
      ) {
        throw new AppError(
          'Invite email permission missing. Please log out and log in again to grant Gmail send access.',
          400
        )
      }

      throw new AppError(message, 500)
    }
  },
}

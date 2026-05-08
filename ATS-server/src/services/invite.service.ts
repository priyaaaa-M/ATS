import crypto from 'crypto'
import { and, desc, eq, gt } from 'drizzle-orm'
import { z } from 'zod'
import { config } from '../config'
import { db } from '../db'
import { invites } from '../db/schema'
import { AppError } from '../types'
import { mailService } from './mail.service'

const generateInviteSchema = z.object({
  email: z.string().email(),
  roleName: z.string().min(1),
  roundNumber: z.number().int().positive(),
  companyId: z.string().uuid(),
  createdByUserId: z.string().uuid(),
})

export const inviteService = {
  generate: async (input: unknown) => {
    const payload = generateInviteSchema.parse(input)
    // Check for existing active invite for same email/role/round
    const existing = await db.query.invites.findFirst({
      where: and(
        eq(invites.email, payload.email.toLowerCase()),
        eq(invites.roleName, payload.roleName),
        eq(invites.roundNumber, payload.roundNumber),
        eq(invites.used, false),
        gt(invites.expiresAt, new Date())
      ),
    })

    if (existing) {
      // Resend existing invite instead of creating a duplicate
      const inviteLink = `${config.appBaseUrl}/invite/${existing.token}`
      await mailService.sendInviteEmail({
        createdByUserId: payload.createdByUserId,
        toEmail: existing.email,
        roleName: existing.roleName,
        roundNumber: existing.roundNumber,
        inviteLink,
        companyId: existing.companyId || payload.companyId,
        expiresInDays: Math.ceil((existing.expiresAt.getTime() - Date.now()) / (24 * 60 * 60 * 1000)),
      })

      return {
        message: 'Existing invite resent',
        invite: existing,
        inviteLink,
      }
    }

    const token = crypto.randomUUID()
    const expiresAt = new Date(
      Date.now() + config.invite.expiryDays * 24 * 60 * 60 * 1000
    )

    const [invite] = await db
      .insert(invites)
      .values({
        ...payload,
        email: payload.email.toLowerCase(),
        token,
        expiresAt,
      })
      .returning()

    const inviteLink = `${config.appBaseUrl}/invite/${token}`

    await mailService.sendInviteEmail({
      createdByUserId: payload.createdByUserId,
      toEmail: invite.email,
      roleName: payload.roleName,
      roundNumber: payload.roundNumber,
      inviteLink,
      companyId: payload.companyId,
      expiresInDays: config.invite.expiryDays,
    })

    return {
      invite,
      inviteLink,
      token,
      expiresAt,
    }
  },

  validateToken: async (token: string) => {
    const invite = await db.query.invites.findFirst({
      where: eq(invites.token, token),
    })

    if (!invite) {
      throw new AppError('Invalid invite link', 404)
    }
    if (invite.used) {
      throw new AppError('Invite already used', 400)
    }
    if (invite.expiresAt < new Date()) {
      throw new AppError('Invite has expired', 400)
    }

    return invite
  },

  listByCompany: async (companyId: string) =>
    db
      .select()
      .from(invites)
      .where(eq(invites.companyId, companyId))
      .orderBy(desc(invites.createdAt)),

  accept: async (token: string, userId: string) => {
    const invite = await inviteService.validateToken(token)

    const [updated] = await db
      .update(invites)
      .set({ used: true })
      .where(and(eq(invites.token, token), eq(invites.used, false)))
      .returning()

    return {
      success: true,
      userId,
      invite: updated || invite,
    }
  },
}

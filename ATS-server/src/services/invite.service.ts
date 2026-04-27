import crypto from 'crypto'
import { and, desc, eq } from 'drizzle-orm'
import { z } from 'zod'
import { config } from '../config'
import { db } from '../db'
import { invites } from '../db/schema'
import { AppError } from '../types'

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

    return {
      invite,
      inviteLink: `${config.appBaseUrl}/invite/${token}`,
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

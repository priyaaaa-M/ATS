import { and, eq } from 'drizzle-orm'
import { db } from '../db'
import { companies, invites, users } from '../db/schema'
import { AppError } from '../types'
import { googleService } from './google.service'
import { syncService } from './sync.service'

function deriveCompanyName(email: string) {
  const domain = email.split('@')[1] || 'company'
  const name = domain.split('.')[0] || 'company'
  return `${name.charAt(0).toUpperCase()}${name.slice(1)}`
}

export const authService = {
  handleGoogleCallback: async (code: string, inviteToken?: string) => {
    const googleUser = await googleService.exchangeCode(code)

    if (!googleUser.email) {
      throw new AppError('Google account email not available', 400)
    }

    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, googleUser.email.toLowerCase()),
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

      if (updatedUser.role === 'hr') {
        void syncService.ensureDriveSetup(updatedUser.id).catch((err) => {
          console.error('[AUTH] Failed to ensure drive setup for existing HR:', err)
        })
      }

      return { user: updatedUser }
    }

    const invite =
      inviteToken &&
      (await db.query.invites.findFirst({
        where: and(eq(invites.token, inviteToken), eq(invites.used, false)),
      }))

    if (
      invite &&
      invite.email.toLowerCase() === googleUser.email.toLowerCase() &&
      invite.expiresAt > new Date()
    ) {
      const [newInterviewer] = await db
        .insert(users)
        .values({
          companyId: invite.companyId || null,
          name: googleUser.name,
          email: googleUser.email.toLowerCase(),
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
        email: googleUser.email.toLowerCase(),
        role: 'hr',
        googleAccessToken: googleUser.accessToken,
        googleRefreshToken: googleUser.refreshToken,
        googleEmail: googleUser.email,
      })
      .returning()

    void syncService.ensureDriveSetup(newHr.id).catch((err) => {
      console.error('[AUTH] Failed to ensure drive setup for new HR:', err)
    })

    return { user: newHr }
  },

  getUserById: async (userId: string) => {
    const user = await db.query.users.findFirst({
      where: eq(users.id, userId),
    })

    if (!user) {
      throw new AppError('User not found', 404)
    }

    const company = user.companyId
      ? await db.query.companies.findFirst({
          where: eq(companies.id, user.companyId),
        })
      : null

    return {
      ...user,
      company,
    }
  },
}

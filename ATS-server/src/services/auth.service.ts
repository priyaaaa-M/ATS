import { and, eq } from 'drizzle-orm'
import { z } from 'zod'
import { db } from '../db'
import { companies, invites, users } from '../db/schema'
import { AppError } from '../types'
import { googleService } from './google.service'

const userRoleSchema = z.enum([
  'executive',
  'hiring_manager',
  'recruiter',
  'interviewer',
  'team_member',
  'hr',
])

function normalizeUserRole(role: string) {
  return userRoleSchema.parse(role)
}

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

    console.log('[AUTH][DB] Checking for existing user...')
    const existingUser = await db.query.users.findFirst({
      where: eq(users.email, googleUser.email.toLowerCase()),
    })
    console.log('[AUTH][DB] Existing user lookup done:', Boolean(existingUser))

    if (existingUser) {
      console.log('[AUTH][DB] Updating existing user...')
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
      console.log('[AUTH][DB] Existing user updated')

      return {
        user: {
          ...updatedUser,
          role: normalizeUserRole(updatedUser.role),
        },
      }
    }

    const invite =
      (console.log('[AUTH][DB] Checking invite token...'),
      inviteToken &&
      (await db.query.invites.findFirst({
        where: and(eq(invites.token, inviteToken), eq(invites.used, false)),
      })))
    console.log('[AUTH][DB] Invite lookup done:', Boolean(invite))

    if (
      invite &&
      invite.email.toLowerCase() === googleUser.email.toLowerCase() &&
      invite.expiresAt > new Date()
    ) {
      console.log('[AUTH][DB] Creating invited interviewer...')
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
      console.log('[AUTH][DB] Invite marked used')

      return {
        user: {
          ...newInterviewer,
          role: normalizeUserRole(newInterviewer.role),
        },
      }
    }

    console.log('[AUTH][DB] Creating company...')
    const [company] = await db
      .insert(companies)
      .values({
        name: deriveCompanyName(googleUser.email),
      })
      .returning()
    console.log('[AUTH][DB] Company created:', company.id)

    console.log('[AUTH][DB] Creating HR user...')
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
    console.log('[AUTH][DB] HR user created:', newHr.id)

    return {
      user: {
        ...newHr,
        role: normalizeUserRole(newHr.role),
      },
    }
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

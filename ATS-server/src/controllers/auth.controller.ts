import type { NextFunction, Request, Response } from 'express'
import { config } from '../config'
import { authService } from '../services/auth.service'
import { googleService } from '../services/google.service'

export const authController = {
  initiateGoogleAuth: (req: Request, res: Response) => {
    const inviteToken =
      typeof req.query.inviteToken === 'string' ? req.query.inviteToken : undefined
    const authUrl = googleService.getAuthUrl(inviteToken)
    res.redirect(authUrl)
  },

  handleGoogleCallback: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      console.log('[AUTH] /auth/google/callback hit. Query:', req.query)

      const { code, state } = req.query as { code?: string; state?: string }
      if (!code) {
        console.log('[AUTH] No code in callback, redirecting to login')
        return res.redirect(`${config.appBaseUrl}/login?error=no_code`)
      }

      const result = await authService.handleGoogleCallback(code, state)
      console.log('[AUTH] User authenticated:', result.user.email, 'ID:', result.user.id)

      req.session.userId = result.user.id
      req.session.userEmail = result.user.email
      req.session.userRole = result.user.role
      req.session.companyId = result.user.companyId || ''

      // Explicitly save session before redirect to ensure cookie is set
      req.session.save((err) => {
        if (err) {
          console.error('[AUTH] Session save error:', err)
          return next(err)
        }

        console.log('[AUTH] Session saved. Session ID:', req.sessionID)
        console.log('[AUTH] Cookie set:', res.getHeader('set-cookie'))

        const redirectPath =
          result.user.role === 'hr' ? '/dashboard' : '/interviewer'

        console.log(
          `[AUTH] Login success for ${result.user.email}, redirecting to ${config.appBaseUrl}${redirectPath}`
        )
        return res.redirect(`${config.appBaseUrl}${redirectPath}`)
      })
    } catch (err) {
      console.error('[AUTH] Callback error:', err)
      return next(err)
    }
  },

  getMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const cookies = req.headers.cookie || ''
      const hasSessionCookie = cookies.includes(config.cookieName)

      console.log(
        '[AUTH] /auth/me called. Session ID:',
        req.sessionID,
        '| userId:',
        req.session?.userId || 'none',
        '| Cookie names:',
        cookies.split(';').map(c => c.split('=')[0].trim()).join(', ') || 'none',
        '| Has session cookie:',
        hasSessionCookie
      )

      if (!req.session?.userId) {
        res.clearCookie(config.cookieName)
        return res.status(200).json({ authenticated: false })
      }

      const user = await authService.getUserById(req.session.userId)
      return res.json({ authenticated: true, user })
    } catch (err) {
      return next(err)
    }
  },

  logout: (req: Request, res: Response, next: NextFunction) => {
    req.session.destroy((err) => {
      if (err) {
        return next(err)
      }

      res.clearCookie(config.cookieName)
      return res.json({ success: true })
    })
  },
}

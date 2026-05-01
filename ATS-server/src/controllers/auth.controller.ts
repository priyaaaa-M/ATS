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

      await new Promise<void>((resolve, reject) => {
        req.session.regenerate((err) => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })

      req.session.userId = result.user.id
      req.session.userEmail = result.user.email
      req.session.userName = result.user.name || undefined
      req.session.userRole = result.user.role
      if (result.user.companyId) {
        req.session.companyId = result.user.companyId
      } else {
        delete req.session.companyId
      }
      console.log('[AUTH] Session userId set to:', req.session.userId)

      // Explicitly save session before redirect to ensure cookie is set
      await new Promise<void>((resolve, reject) => {
        req.session.save((err) => {
          if (err) {
            return reject(err)
          }
          resolve()
        })
      })

      console.log('[AUTH] Session saved. Session ID:', req.sessionID)
      console.log('[AUTH] Session cookie object:', req.session.cookie)
      console.log('[AUTH] Cookie set:', res.getHeader('set-cookie'))

      console.log(
        `[AUTH] Login success for ${result.user.email}, sending browser redirect to ${config.appBaseUrl}`
      )
      return res
        .status(200)
        .type('html')
        .send(`<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <meta http-equiv="refresh" content="0;url=${config.appBaseUrl}" />
    <title>Signing in...</title>
  </head>
  <body>
    <script>
      window.location.href = ${JSON.stringify(config.appBaseUrl)};
    </script>
  </body>
</html>`)
    } catch (err) {
      console.error('[AUTH] Callback error:', err)
      return next(err)
    }
  },

  getMe: async (req: Request, res: Response, next: NextFunction) => {
    try {
      res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
      res.setHeader('Pragma', 'no-cache')
      res.setHeader('Expires', '0')

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
      console.log('[AUTH] /auth/me raw Cookie header:', req.headers.cookie || 'none')
      console.log('[AUTH] /auth/me session keys:', Object.keys(req.session || {}))

      if (!req.session?.userId) {
        return res.status(200).json({ authenticated: false, user: null })
      }

      try {
        const user = await authService.getUserById(req.session.userId)
        return res.json({ authenticated: true, user })
      } catch (err: any) {
        if (err.statusCode === 404) {
          // Clear invalid session
          return new Promise<void>((resolve) => {
            req.session.destroy(() => {
              res.clearCookie(config.cookieName)
              res.status(200).json({ authenticated: false, user: null })
              resolve()
            })
          })
        }
        throw err
      }
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

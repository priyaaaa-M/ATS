import type { NextFunction, Request, Response } from 'express'

import { config } from '../config'

export async function authMiddleware(
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (!req.session?.userId) {
    res.clearCookie(config.cookieName)
    return res.status(401).json({
      error: 'Unauthorized',
      message: 'Please log in to continue',
    })
  }

  next()
}

declare module 'express-session' {
  interface SessionData {
    userId: string
    userEmail: string
    userRole: string
    companyId: string
  }
}

import type { NextFunction, Request, Response } from 'express'
import type { UserRole } from '../types'

export function requireRole(...roles: UserRole[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!roles.includes(req.session?.userRole as UserRole)) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires one of: ${roles.join(', ')}`,
      })
    }

    next()
  }
}

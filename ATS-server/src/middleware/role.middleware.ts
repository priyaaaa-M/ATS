import type { NextFunction, Request, Response } from 'express'

export function requireRole(role: 'hr' | 'interviewer') {
  return (req: Request, res: Response, next: NextFunction) => {
    if (req.session?.userRole !== role) {
      return res.status(403).json({
        error: 'Forbidden',
        message: `This action requires ${role} role`,
      })
    }

    next()
  }
}

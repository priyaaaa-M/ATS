import type { NextFunction, Request, Response } from 'express'
import { requireCompanyId } from '../utils/session'

export function requireCompanyContext(
  req: Request,
  res: Response,
  next: NextFunction
) {
  try {
    requireCompanyId(req)
    return next()
  } catch (err) {
    return res.status(400).json({
      error: 'Bad Request',
      message: err instanceof Error ? err.message : 'Company context is required',
    })
  }
}

import type { Request } from 'express'
import { AppError } from '../types'

export function requireCompanyId(req: Request): string {
  const companyId = req.session.companyId

  if (!companyId) {
    throw new AppError('Company context is required', 400)
  }

  return companyId
}

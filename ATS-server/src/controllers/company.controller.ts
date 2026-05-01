import type { NextFunction, Request, Response } from 'express'
import { companyService } from '../services/company.service'
import { requireCompanyId } from '../utils/session'

export const companyController = {
  getProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireCompanyId(req)
      const profile = await companyService.getProfile(companyId)
      return res.json(profile)
    } catch (err) {
      return next(err)
    }
  },

  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireCompanyId(req)
      const profile = await companyService.updateProfile(
        companyId,
        req.body
      )
      return res.json(profile)
    } catch (err) {
      return next(err)
    }
  },

  getDriveConfig: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const config = await companyService.getDriveConfig(req.session.userId!)
      return res.json(config)
    } catch (err) {
      return next(err)
    }
  },

  saveDriveConfig: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const companyId = requireCompanyId(req)
      const driveConfig = await companyService.saveDriveConfig(
        req.session.userId!,
        companyId,
        req.body
      )
      return res.status(201).json(driveConfig)
    } catch (err) {
      return next(err)
    }
  },
}

import type { NextFunction, Request, Response } from 'express'
import { companyService } from '../services/company.service'

export const companyController = {
  getProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await companyService.getProfile(req.session.companyId)
      return res.json(profile)
    } catch (err) {
      return next(err)
    }
  },

  updateProfile: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const profile = await companyService.updateProfile(
        req.session.companyId,
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
      const driveConfig = await companyService.saveDriveConfig(
        req.session.userId!,
        req.session.companyId,
        req.body
      )
      return res.status(201).json(driveConfig)
    } catch (err) {
      return next(err)
    }
  },
}

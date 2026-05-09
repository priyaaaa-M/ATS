import type { NextFunction, Request, Response } from 'express'
import { dashboardService } from '../services/dashboard.service'

export const dashboardController = {
  getActivity: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dashboardService.getActivity(req.session.userId!)
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  getActions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await dashboardService.getActions(req.session.userId!)
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },
}

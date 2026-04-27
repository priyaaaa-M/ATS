import type { NextFunction, Request, Response } from 'express'
import { roleService } from '../services/role.service'

export const rolesController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await roleService.listByUser(req.session.userId!)
      return res.json(roles)
    } catch (err) {
      return next(err)
    }
  },

  syncFromDrive: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await roleService.syncFromDrive(req.session.userId!)
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },
}

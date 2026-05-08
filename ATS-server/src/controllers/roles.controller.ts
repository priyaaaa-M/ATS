import type { NextFunction, Request, Response } from 'express'
import { roleService } from '../services/role.service'
import { candidateService } from '../services/candidate.service'

export const rolesController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await roleService.listByUser(req.session.userId!)
      return res.json(roles)
    } catch (err) {
      return next(err)
    }
  },

  getScreeningQuestions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await roleService.getScreeningQuestions(
        req.session.userId!,
        req.params.roleName
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  updateScreeningQuestions: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.updateRoleScreeningQuestions(
        req.session.userId!,
        req.params.roleName,
        {
          screeningQuestions: req.body?.screeningQuestions,
        }
      )
      return res.json(result)
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

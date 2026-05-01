import type { NextFunction, Request, Response } from 'express'
import { roleDetailsService } from '../services/role-details.service'

export const roleDetailsController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const roles = await roleDetailsService.list(req.session.userId!)
      return res.json(roles)
    } catch (err) {
      return next(err)
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await roleDetailsService.getById(
        req.params.id,
        req.session.userId!
      )

      if (!role) {
        return res.status(404).json({ error: 'Role not found' })
      }

      return res.json(role)
    } catch (err) {
      return next(err)
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await roleDetailsService.create(req.body, req.session.userId!)
      return res.status(201).json(role)
    } catch (err) {
      return next(err)
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const role = await roleDetailsService.update(
        req.params.id,
        req.body,
        req.session.userId!
      )
      return res.json(role)
    } catch (err) {
      return next(err)
    }
  },

  remove: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await roleDetailsService.delete(
        req.params.id,
        req.session.userId!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },
}

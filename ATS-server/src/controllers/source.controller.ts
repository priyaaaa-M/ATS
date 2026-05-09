import type { NextFunction, Request, Response } from 'express'
import { sourceService } from '../services/source.service'

export const sourceController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const sources = await sourceService.list(
        req.session.companyId!,
        req.session.userId!
      )
      return res.json(sources)
    } catch (err) {
      return next(err)
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const source = await sourceService.create(
        req.session.companyId!,
        req.session.userId!,
        req.body
      )
      return res.status(201).json(source)
    } catch (err) {
      return next(err)
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const source = await sourceService.update(
        req.session.companyId!,
        req.params.id,
        req.body
      )
      return res.json(source)
    } catch (err) {
      return next(err)
    }
  },

  deactivate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const source = await sourceService.deactivate(
        req.session.companyId!,
        req.params.id
      )
      return res.json(source)
    } catch (err) {
      return next(err)
    }
  },
}

import type { NextFunction, Request, Response } from 'express'
import { inviteService } from '../services/invite.service'

export const inviteController = {
  validateToken: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invite = await inviteService.validateToken(req.params.token)
      return res.json(invite)
    } catch (err) {
      return next(err)
    }
  },

  generate: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invite = await inviteService.generate({
        ...req.body,
        companyId: req.session.companyId,
        createdByUserId: req.session.userId!,
      })
      return res.status(201).json(invite)
    } catch (err) {
      return next(err)
    }
  },

  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const invites = await inviteService.listByCompany(req.session.companyId!)
      return res.json(invites)
    } catch (err) {
      return next(err)
    }
  },

  accept: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await inviteService.accept(req.params.token, req.session.userId!)
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },
}

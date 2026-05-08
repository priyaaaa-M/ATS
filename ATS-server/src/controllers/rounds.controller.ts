import type { NextFunction, Request, Response } from 'express'
import { roundService } from '../services/round.service'

export const roundsController = {
  listAll: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rounds = await roundService.listAll(req.session.userId!)
      return res.json(rounds)
    } catch (err) {
      return next(err)
    }
  },

  listByRole: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rounds = await roundService.listByRole(
        req.session.userId!,
        req.params.roleName
      )
      return res.json(rounds)
    } catch (err) {
      return next(err)
    }
  },

  create: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const round = await roundService.create(req.session.userId!, req.body)
      return res.status(201).json(round)
    } catch (err) {
      return next(err)
    }
  },

  update: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const round = await roundService.update(req.session.userId!, req.params.id, req.body)
      return res.json(round)
    } catch (err) {
      return next(err)
    }
  },

  delete: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await roundService.remove(req.session.userId!, req.params.id)
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },
}

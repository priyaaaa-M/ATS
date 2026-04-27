import type { NextFunction, Request, Response } from 'express'
import { candidateService } from '../services/candidate.service'

export const candidatesController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, status, search, min_ats_score, round } = req.query
      const candidates = await candidateService.list({
        userId: req.session.userId!,
        userRole: req.session.userRole as 'hr' | 'interviewer',
        userEmail: req.session.userEmail!,
        filters: {
          role: role as string | undefined,
          status: status as string | undefined,
          search: search as string | undefined,
          minAtsScore: min_ats_score
            ? Number.parseInt(min_ats_score as string, 10)
            : undefined,
          round: round ? Number.parseInt(round as string, 10) : undefined,
        },
      })

      return res.json(candidates)
    } catch (err) {
      return next(err)
    }
  },

  getById: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const candidate = await candidateService.getById(
        req.params.id,
        req.session.userId!,
        req.session.userRole as 'hr' | 'interviewer',
        req.session.userEmail!
      )

      if (!candidate) {
        return res.status(404).json({ error: 'Candidate not found' })
      }

      return res.json(candidate)
    } catch (err) {
      return next(err)
    }
  },

  approve: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.approve(
        req.params.id,
        req.session.userId!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  reject: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.reject(req.params.id, req.session.userId!)
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  select: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.select(req.params.id, req.session.userId!)
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  advanceToNextRound: async (
    req: Request,
    res: Response,
    next: NextFunction
  ) => {
    try {
      const result = await candidateService.advanceToNextRound(
        req.params.id,
        req.session.userId!,
        req.session.userEmail!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },
}

import type { NextFunction, Request, Response } from 'express'
import { candidateService } from '../services/candidate.service'

export const candidatesController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { role, status, search, min_ats_score, round } = req.query
      const candidates = await candidateService.list({
        userId: req.session.userId!,
        userRole: req.session.userRole as
          | 'executive'
          | 'hiring_manager'
          | 'recruiter'
          | 'interviewer'
          | 'team_member'
          | 'hr',
        userEmail: req.session.userEmail!,
        filters: {
          role: role as string | undefined,
          status: status as string | undefined,
          search: search as string | undefined,
          minAtsScore: min_ats_score
            ? Number.parseInt(min_ats_score as string, 10)
            : undefined,
          round: round ? Number.parseInt(round as string, 10) : undefined,
          inboxStatus: (req.query.inboxStatus as any) || undefined,
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
        req.session.userRole as
          | 'executive'
          | 'hiring_manager'
          | 'recruiter'
          | 'interviewer'
          | 'team_member'
          | 'hr',
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

  moveToPipeline: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.moveToPipeline(
        req.params.id,
        req.session.userId!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  notInterested: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await candidateService.notInterested(
        req.params.id,
        req.session.userId!,
        req.body?.reason
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  addNote: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const text = String(req.body?.text || '').trim()
      if (!text) {
        return res.status(400).json({ error: 'Bad Request', message: 'Note text is required' })
      }

      const result = await candidateService.addNote(
        req.params.id,
        req.session.userId!,
        req.session.userName || 'Current User',
        text
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  moveStage: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const stageName = String(req.body?.stageName || '').trim()
      if (!stageName) {
        return res.status(400).json({ error: 'Bad Request', message: 'stageName is required' })
      }

      const result = await candidateService.moveStage(
        req.params.id,
        req.session.userId!,
        stageName
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },
}

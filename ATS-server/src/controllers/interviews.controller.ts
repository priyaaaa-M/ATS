import type { NextFunction, Request, Response } from 'express'
import { interviewService } from '../services/interview.service'

export const interviewsController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.list(
        req.session.userId!,
        req.session.userRole as 'hr' | 'interviewer',
        req.session.userEmail!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  book: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.bookInterview({
        ...req.body,
        hrUserId: req.session.userId!,
      })
      return res.status(201).json(result)
    } catch (err) {
      return next(err)
    }
  },

  reschedule: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.rescheduleInterview(
        req.params.id,
        req.body,
        req.session.userId!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  cancel: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.cancelInterview(
        req.params.id,
        req.session.userId!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },

  getByCandidateId: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await interviewService.getByCandidateId(
        req.params.candidateId,
        req.session.userId!,
        req.session.userRole as 'hr' | 'interviewer',
        req.session.userEmail!
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },
}

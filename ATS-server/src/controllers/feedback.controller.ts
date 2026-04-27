import type { NextFunction, Request, Response } from 'express'
import { feedbackService } from '../services/feedback.service'

export const feedbackController = {
  submit: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await feedbackService.submit({
        ...req.body,
        userId: req.session.userId!,
        userEmail: req.session.userEmail!,
      })
      return res.status(201).json(result)
    } catch (err) {
      return next(err)
    }
  },

  getByRound: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await feedbackService.getByRound(
        req.params.candidateId,
        Number.parseInt(req.params.roundNumber, 10),
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

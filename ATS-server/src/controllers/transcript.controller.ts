import type { NextFunction, Request, Response } from 'express'
import { transcriptService } from '../services/transcript.service'

export const transcriptController = {
  getByRound: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await transcriptService.getByRound(
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

  saveManual: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await transcriptService.saveManual({
        ...req.body,
        userId: req.session.userId!,
        userEmail: req.session.userEmail!,
      })
      return res.status(201).json(result)
    } catch (err) {
      return next(err)
    }
  },

  triggerFetch: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await transcriptService.triggerFetch(req.params.interviewId)
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },
}

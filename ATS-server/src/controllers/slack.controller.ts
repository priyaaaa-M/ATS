import type { NextFunction, Request, Response } from 'express'
import { slackService } from '../services/slack.service'

export const slackController = {
  test: async (req: Request, res: Response, next: NextFunction) => {
    try {
      await slackService.sendTestMessage(req.session.companyId!)
      return res.json({ success: true })
    } catch (err) {
      return next(err)
    }
  },
}

import type { NextFunction, Request, Response } from 'express'
import { calendarService } from '../services/calendar.service'

export const calendarController = {
  getFreeSlots: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const result = await calendarService.getFreeSlots(
        req.body.interviewerEmail,
        req.body.date,
        req.body.durationMinutes
      )
      return res.json(result)
    } catch (err) {
      return next(err)
    }
  },
}

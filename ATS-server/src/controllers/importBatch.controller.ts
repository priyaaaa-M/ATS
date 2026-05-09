import type { NextFunction, Request, Response } from 'express'
import { importBatchService } from '../services/importBatch.service'

export const importBatchController = {
  list: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const batches = await importBatchService.listByUser(req.session.userId!)
      return res.json(batches)
    } catch (err) {
      return next(err)
    }
  },
}

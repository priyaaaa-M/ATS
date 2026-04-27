import type { NextFunction, Request, Response } from 'express'
import { syncService } from '../services/sync.service'

export const syncController = {
  syncDrive: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const status = await syncService.ensureCanRun(req.session.userId!)
      if (status.isSyncRunning) {
        return res.status(409).json({
          error: 'Sync already running',
          message: 'Please wait for the current sync to complete',
        })
      }

      res.json({
        success: true,
        message: 'Drive sync started. Check /api/sync/status for progress.',
      })

      void syncService.runDriveSync(req.session.userId!).catch((err) => {
        console.error('[SYNC] Background sync failed:', err)
      })
    } catch (err) {
      return next(err)
    }
  },

  getStatus: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const state = await syncService.getStatus(req.session.userId!)
      return res.json(state)
    } catch (err) {
      return next(err)
    }
  },
}

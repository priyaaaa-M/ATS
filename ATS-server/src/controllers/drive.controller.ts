import type { NextFunction, Request, Response } from 'express'
import { driveService } from '../services/drive.service'
import { companyService } from '../services/company.service'
import { syncService } from '../services/sync.service'

export const driveController = {
  getContents: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const folderId = req.query.folderId as string
      let targetFolderId = folderId
      
      if (!targetFolderId) {
        targetFolderId = await syncService.ensureDriveSetup(req.session.userId!)
      }
      
      const contents = await driveService.getFolderContents(req.session.userId!, targetFolderId)
      return res.json({ folderId: targetFolderId, contents })
    } catch (err) {
      return next(err)
    }
  },

  createFolder: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const { name, parentId } = req.body
      const folder = await driveService.createFolder(req.session.userId!, name, parentId)
      return res.json(folder)
    } catch (err) {
      return next(err)
    }
  }
}

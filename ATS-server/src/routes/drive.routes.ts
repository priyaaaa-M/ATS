import { Router } from 'express'
import { driveController } from '../controllers/drive.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.use(authMiddleware)
router.use(requireRole('hr'))
router.get('/contents', driveController.getContents)
router.post('/folders', driveController.createFolder)

export { router as driveRoutes }

import { Router } from 'express'
import { syncController } from '../controllers/sync.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.use(authMiddleware)
router.use(requireRole('hr'))
router.post('/drive', syncController.syncDrive)
router.get('/drive/validate', syncController.validateDrive)
router.get('/status', syncController.getStatus)

export { router as syncRoutes }

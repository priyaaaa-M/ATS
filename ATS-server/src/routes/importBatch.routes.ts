import { Router } from 'express'
import { importBatchController } from '../controllers/importBatch.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.use(authMiddleware)
router.get('/', requireRole('hr'), importBatchController.list)

export { router as importBatchRoutes }

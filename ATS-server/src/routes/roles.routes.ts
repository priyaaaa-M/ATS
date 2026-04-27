import { Router } from 'express'
import { rolesController } from '../controllers/roles.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.use(authMiddleware)
router.use(requireRole('hr'))
router.get('/', rolesController.list)
router.post('/sync-from-drive', rolesController.syncFromDrive)

export { router as rolesRoutes }

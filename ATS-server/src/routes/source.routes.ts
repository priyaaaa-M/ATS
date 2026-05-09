import { Router } from 'express'
import { sourceController } from '../controllers/source.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.use(authMiddleware)
router.get('/', sourceController.list)
router.post('/', requireRole('hr'), sourceController.create)
router.put('/:id', requireRole('hr'), sourceController.update)
router.delete('/:id', requireRole('hr'), sourceController.deactivate)

export { router as sourceRoutes }

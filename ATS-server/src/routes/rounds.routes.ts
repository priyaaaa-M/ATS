import { Router } from 'express'
import { roundsController } from '../controllers/rounds.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.use(authMiddleware)
router.use(requireRole('hr'))
router.get('/:roleName', roundsController.listByRole)
router.post('/', roundsController.create)
router.put('/:id', roundsController.update)
router.delete('/:id', roundsController.delete)

export { router as roundsRoutes }

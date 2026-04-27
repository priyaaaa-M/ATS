import { Router } from 'express'
import { candidatesController } from '../controllers/candidates.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.use(authMiddleware)
router.get('/', candidatesController.list)
router.get('/:id', candidatesController.getById)
router.post('/:id/approve', requireRole('hr'), candidatesController.approve)
router.post('/:id/reject', requireRole('hr'), candidatesController.reject)
router.post('/:id/select', requireRole('hr'), candidatesController.select)
router.post(
  '/:id/advance',
  requireRole('interviewer'),
  candidatesController.advanceToNextRound
)

export { router as candidatesRoutes }

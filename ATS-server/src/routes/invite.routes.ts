import { Router } from 'express'
import { inviteController } from '../controllers/invite.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.get('/:token', inviteController.validateToken)
router.use(authMiddleware)
router.post('/generate', requireRole('hr'), inviteController.generate)
router.get('/', requireRole('hr'), inviteController.list)
router.post('/:token/accept', inviteController.accept)

export { router as inviteRoutes }

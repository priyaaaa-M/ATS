import { Router } from 'express'
import { inviteController } from '../controllers/invite.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireCompanyContext } from '../middleware/company.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.get('/:token', inviteController.validateToken)
router.use(authMiddleware)
router.post('/generate', requireCompanyContext, requireRole('hr'), inviteController.generate)
router.get('/', requireCompanyContext, requireRole('hr'), inviteController.list)
router.post('/:token/accept', inviteController.accept)

export { router as inviteRoutes }

import { Router } from 'express'
import { slackController } from '../controllers/slack.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.use(authMiddleware)
router.use(requireRole('hr'))
router.post('/test', slackController.test)

export { router as slackRoutes }

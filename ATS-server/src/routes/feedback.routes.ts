import { Router } from 'express'
import { feedbackController } from '../controllers/feedback.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)
router.post('/', feedbackController.submit)
router.get('/:candidateId/:roundNumber', feedbackController.getByRound)

export { router as feedbackRoutes }

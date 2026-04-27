import { Router } from 'express'
import { transcriptController } from '../controllers/transcript.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)
router.get('/:candidateId/:roundNumber', transcriptController.getByRound)
router.post('/manual', transcriptController.saveManual)
router.post('/fetch/:interviewId', transcriptController.triggerFetch)

export { router as transcriptRoutes }

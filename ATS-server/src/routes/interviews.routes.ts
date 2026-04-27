import { Router } from 'express'
import { interviewsController } from '../controllers/interviews.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)
router.get('/', interviewsController.list)
router.post('/book', interviewsController.book)
router.put('/:id/reschedule', interviewsController.reschedule)
router.delete('/:id', interviewsController.cancel)
router.get('/candidate/:candidateId', interviewsController.getByCandidateId)

export { router as interviewsRoutes }

import { Router } from 'express'
import { interviewsController } from '../controllers/interviews.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)
router.get('/', interviewsController.list)
router.get('/week', interviewsController.byWeek)
router.get('/mine', interviewsController.mine)
router.post('/book', interviewsController.book)
router.post('/:id/reminder', interviewsController.sendReminder)
router.put('/:id/reschedule', interviewsController.reschedule)
router.delete('/:id', interviewsController.cancel)
router.get('/candidate/:candidateId', interviewsController.getByCandidateId)

export { router as interviewsRoutes }

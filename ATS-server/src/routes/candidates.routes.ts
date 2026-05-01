import { Router } from 'express'
import { candidatesController } from '../controllers/candidates.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.use(authMiddleware)
router.get('/', candidatesController.list)
router.get('/:id', candidatesController.getById)
router.post('/:id/approve', requireRole('hr', 'executive', 'hiring_manager', 'recruiter'), candidatesController.approve)
router.post('/:id/reject', requireRole('hr', 'executive', 'hiring_manager', 'recruiter'), candidatesController.reject)
router.post('/:id/select', requireRole('hr', 'executive', 'hiring_manager', 'recruiter'), candidatesController.select)
router.post('/:id/move-to-pipeline', requireRole('hr', 'executive', 'hiring_manager', 'recruiter'), candidatesController.moveToPipeline)
router.post('/:id/not-interested', requireRole('hr', 'executive', 'hiring_manager', 'recruiter'), candidatesController.notInterested)
router.post('/:id/notes', requireRole('hr', 'executive', 'hiring_manager', 'recruiter', 'interviewer'), candidatesController.addNote)
router.post('/:id/move-stage', requireRole('hr', 'executive', 'hiring_manager', 'recruiter', 'interviewer'), candidatesController.moveStage)
router.post(
  '/:id/advance',
  requireRole('interviewer'),
  candidatesController.advanceToNextRound
)

export { router as candidatesRoutes }

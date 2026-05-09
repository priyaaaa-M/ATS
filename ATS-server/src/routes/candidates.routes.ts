import { Router } from 'express'
import { candidatesController } from '../controllers/candidates.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.use(authMiddleware)
router.get('/', candidatesController.list)
router.get('/counts', candidatesController.counts)
router.get('/pipeline', requireRole('hr'), candidatesController.pipeline)
router.get(
  '/approved-by-me',
  requireRole('interviewer'),
  candidatesController.approvedByInterviewer
)
router.get('/:id/resume', candidatesController.getResume)
router.get('/:id', candidatesController.getById)
router.get('/:id/activity', candidatesController.getActivity)
router.get('/:id/notes', candidatesController.getNotes)
router.get('/:id/scorecard', candidatesController.getScorecard)
router.post('/:id/approve', requireRole('hr'), candidatesController.approve)
router.post('/:id/action', candidatesController.action)
router.post('/:id/move-stage', requireRole('hr'), candidatesController.moveStage)
router.post('/:id/notes', candidatesController.addNote)
router.post('/:id/notes/ai-draft', requireRole('hr'), candidatesController.draftMeetingNote)
router.post('/:id/scorecard', candidatesController.saveScorecard)
router.post('/:id/reject', requireRole('hr'), candidatesController.reject)
router.post('/:id/select', requireRole('hr'), candidatesController.select)
router.post(
  '/:id/advance',
  requireRole('interviewer'),
  candidatesController.advanceToNextRound
)

export { router as candidatesRoutes }

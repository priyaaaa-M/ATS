import { Router } from 'express'
import { candidatesController } from '../controllers/candidates.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'
import multer from 'multer'

const router = Router()
const upload = multer({ storage: multer.memoryStorage() })

router.use(authMiddleware)
router.get('/', candidatesController.list)
router.post(
  '/',
  requireRole('hr'),
  upload.single('resume'),
  candidatesController.create
)
router.get('/:id', candidatesController.getById)
router.post('/:id/approve', requireRole('hr'), candidatesController.approve)
router.post('/:id/reject', requireRole('hr'), candidatesController.reject)
router.post('/:id/select', requireRole('hr'), candidatesController.select)
router.post(
  '/:id/advance',
  requireRole('interviewer'),
  candidatesController.advanceToNextRound
)
router.post(
  '/extract',
  requireRole('hr'),
  upload.single('resume'),
  candidatesController.extract
)

export { router as candidatesRoutes }

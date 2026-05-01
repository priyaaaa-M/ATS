import { Router } from 'express'
import { roleDetailsController } from '../controllers/role-details.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.use(authMiddleware)
router.get('/', requireRole('hr', 'executive', 'hiring_manager', 'recruiter', 'team_member'), roleDetailsController.list)
router.get('/:id', requireRole('hr', 'executive', 'hiring_manager', 'recruiter', 'team_member'), roleDetailsController.getById)
router.post('/', requireRole('hr', 'executive', 'hiring_manager', 'recruiter'), roleDetailsController.create)
router.put('/:id', requireRole('hr', 'executive', 'hiring_manager', 'recruiter'), roleDetailsController.update)
router.delete('/:id', requireRole('hr', 'executive', 'hiring_manager', 'recruiter'), roleDetailsController.remove)

export { router as roleDetailsRoutes }

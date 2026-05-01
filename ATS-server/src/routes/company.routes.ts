import { Router } from 'express'
import { companyController } from '../controllers/company.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { requireCompanyContext } from '../middleware/company.middleware'
import { requireRole } from '../middleware/role.middleware'

const router = Router()

router.use(authMiddleware)
router.use(requireCompanyContext)
router.get('/profile', companyController.getProfile)
router.put('/profile', requireRole('hr'), companyController.updateProfile)
router.get('/drive-config', companyController.getDriveConfig)
router.post('/drive-config', requireRole('hr'), companyController.saveDriveConfig)

export { router as companyRoutes }

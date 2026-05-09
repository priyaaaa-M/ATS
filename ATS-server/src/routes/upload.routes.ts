import { Router } from 'express'
import multer from 'multer'
import { uploadController } from '../controllers/upload.controller'
import { authMiddleware } from '../middleware/auth.middleware'
import { asyncHandler } from '../utils/asyncHandler'

const router = Router()
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB
    files: 50,
  },
})

router.post(
  '/bulk',
  authMiddleware,
  upload.array('resumes', 50),
  asyncHandler(uploadController.bulkUpload)
)

export { router as uploadRoutes }

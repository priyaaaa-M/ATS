import { Router } from 'express'
import { authController } from '../controllers/auth.controller'

const router = Router()

router.get('/google', authController.initiateGoogleAuth)
router.get('/google/callback', authController.handleGoogleCallback)
router.get('/me', authController.getMe)
router.post('/logout', authController.logout)

export { router as authRoutes }

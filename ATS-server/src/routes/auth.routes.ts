import { Router } from 'express'
import { authController } from '../controllers/auth.controller'

const router = Router()

router.use((_req, res, next) => {
  res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate')
  res.setHeader('Pragma', 'no-cache')
  res.setHeader('Expires', '0')
  next()
})

router.get('/google', authController.initiateGoogleAuth)
router.get('/google/callback', authController.handleGoogleCallback)
router.get('/me', authController.getMe)
router.post('/logout', authController.logout)

export { router as authRoutes }

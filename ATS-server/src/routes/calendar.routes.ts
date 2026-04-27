import { Router } from 'express'
import { calendarController } from '../controllers/calendar.controller'
import { authMiddleware } from '../middleware/auth.middleware'

const router = Router()

router.use(authMiddleware)
router.post('/free-slots', calendarController.getFreeSlots)

export { router as calendarRoutes }

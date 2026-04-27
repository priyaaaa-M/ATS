import { Router } from 'express'
import { webhookController } from '../controllers/webhook.controller'

const router = Router()

router.post('/readai', webhookController.handleReadai)

export { router as webhookRoutes }

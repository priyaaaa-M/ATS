import crypto from 'crypto'
import type { NextFunction, Request, Response } from 'express'
import { config } from '../config'
import { readaiService } from '../services/readai.service'

export const webhookController = {
  handleReadai: async (req: Request, res: Response, next: NextFunction) => {
    try {
      const rawBody = req.body as Buffer
      const signature = req.headers['x-read-signature'] as string | undefined

      if (config.readai.webhookSecret) {
        const expected = crypto
          .createHmac('sha256', config.readai.webhookSecret)
          .update(rawBody)
          .digest('hex')

        if (!signature || signature !== expected) {
          return res.status(401).json({ error: 'Invalid signature' })
        }
      }

      res.status(200).json({ received: true })

      const payload = JSON.parse(rawBody.toString())
      void readaiService.processWebhook(payload).catch((err) => {
        console.error('[WEBHOOK] Processing error:', err)
      })
    } catch (err) {
      return next(err)
    }
  },
}

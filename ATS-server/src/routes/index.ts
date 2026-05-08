import type { Express } from 'express'
import { authRoutes } from './auth.routes'
import { calendarRoutes } from './calendar.routes'
import { candidatesRoutes } from './candidates.routes'
import { companyRoutes } from './company.routes'
import { dashboardRoutes } from './dashboard.routes'
import { feedbackRoutes } from './feedback.routes'
import { interviewsRoutes } from './interviews.routes'
import { inviteRoutes } from './invite.routes'
import { rolesRoutes } from './roles.routes'
import { roundsRoutes } from './rounds.routes'
import { slackRoutes } from './slack.routes'
import { syncRoutes } from './sync.routes'
import { transcriptRoutes } from './transcript.routes'
import { webhookRoutes } from './webhook.routes'

export function registerRoutes(app: Express) {
  app.use('/auth', authRoutes)
  app.use('/api/candidates', candidatesRoutes)
  app.use('/api/roles', rolesRoutes)
  app.use('/api/rounds', roundsRoutes)
  app.use('/api/interviews', interviewsRoutes)
  app.use('/api/calendar', calendarRoutes)
  app.use('/api/invite', inviteRoutes)
  app.use('/api/feedback', feedbackRoutes)
  app.use('/api/transcripts', transcriptRoutes)
  app.use('/api/company', companyRoutes)
  app.use('/api/dashboard', dashboardRoutes)
  app.use('/api/slack', slackRoutes)
  app.use('/api/sync', syncRoutes)
  app.use('/api/webhooks', webhookRoutes)
}

import cors from 'cors'
import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import morgan from 'morgan'
import FileStoreFactory from 'session-file-store'
import { config } from './config'

const FileStore = FileStoreFactory(session)
import { errorMiddleware } from './middleware/error.middleware'
import { registerRoutes } from './routes'

export function createApp() {
  const app = express()

  app.use(
    helmet({
      contentSecurityPolicy: false,
    })
  )

  app.use(
    cors({
      origin: config.allowedOrigins,
      credentials: true,
      methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    })
  )

  app.use('/api/webhooks', express.raw({ type: 'application/json' }))
  app.use(express.json({ limit: '10mb' }))
  app.use(express.urlencoded({ extended: true }))
  app.use(morgan(config.isDev ? 'dev' : 'combined'))
  app.use(
    session({
      name: config.cookieName,
      secret: config.session.secret,
      store: new FileStore({
        path: './sessions',
        retries: 0,
      }),
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: false,
        httpOnly: true,
        maxAge: config.session.maxAge,
        sameSite: false,
      },
    })
  )

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  registerRoutes(app)
  app.use(errorMiddleware)

  return app
}

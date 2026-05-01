import cors from 'cors'
import express from 'express'
import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'
import helmet from 'helmet'
import morgan from 'morgan'
import postgres from 'postgres'
import { config } from './config'
import { db } from './db'
import { users } from './db/schema'
import { errorMiddleware } from './middleware/error.middleware'
import { registerRoutes } from './routes'

export function createApp() {
  const app = express()
  const PgStore = connectPgSimple(session)
  const sql = postgres(config.supabase.dbUrl)

  app.set('trust proxy', 1)

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
      resave: false,
      saveUninitialized: false,
      proxy: true,
      store: new PgStore({
        conObject: {
          connectionString: config.supabase.dbUrl,
          ssl: { rejectUnauthorized: false },
        },
        createTableIfMissing: true,
      }),
      cookie: {
        secure: !config.isDev,
        httpOnly: true,
        maxAge: config.session.maxAge,
        sameSite: 'lax',
      },
    })
  )

  app.get('/', (_req, res) => {
    res.json({
      status: 'ok',
      message: 'ATS server is running',
      health: '/health',
    })
  })

  app.get('/health', (_req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() })
  })

  app.get('/db-test', async (_req, res, next) => {
    try {
      const rows = await db.select({ id: users.id }).from(users).limit(1)

      return res.json({
        status: 'ok',
        connected: true,
        rowsFound: rows.length,
      })
    } catch (err) {
      return next(err)
    }
  })

  registerRoutes(app)
  app.use(errorMiddleware)

  void sql

  return app
}

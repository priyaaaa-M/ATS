import cors from 'cors'
import express from 'express'
import session from 'express-session'
import helmet from 'helmet'
import morgan from 'morgan'
import postgres from 'postgres'
import { randomUUID } from 'crypto'
import { config } from './config'
import { errorMiddleware } from './middleware/error.middleware'
import { registerRoutes } from './routes'

let sql = postgres(config.supabase.dbUrl, {
  max: 1,
  prepare: false,
  idle_timeout: 20,
  connect_timeout: 10,
})

function isRetryableSessionStoreError(error: unknown) {
  const code = typeof error === 'object' && error && 'code' in error
    ? String((error as { code?: string }).code)
    : ''

  return code === '26000'
}

async function recreateSessionClient() {
  try {
    await sql.end({ timeout: 1 })
  } catch {
    // best-effort cleanup before recreating the connection
  }

  sql = postgres(config.supabase.dbUrl, {
    max: 1,
    prepare: false,
    idle_timeout: 20,
    connect_timeout: 10,
  })
}

async function runSessionQuery<T>(operation: () => Promise<T>): Promise<T> {
  try {
    return await operation()
  } catch (error) {
    if (!isRetryableSessionStoreError(error)) {
      throw error
    }

    await recreateSessionClient()
    return operation()
  }
}

function normalizeStoredSession(
  value: unknown
): session.SessionData | null {
  if (!value) return null

  const parsed =
    typeof value === 'string'
      ? (JSON.parse(value) as Record<string, unknown>)
      : (value as Record<string, unknown>)

  const cookieValue =
    parsed.cookie && typeof parsed.cookie === 'object'
      ? (parsed.cookie as Record<string, unknown>)
      : {}

  return {
    ...((parsed as unknown) as session.SessionData),
    cookie: {
      path: '/',
      httpOnly: true,
      secure: false,
      maxAge: config.session.maxAge,
      ...cookieValue,
    } as session.Cookie,
  }
}

class PostgresSessionStore extends session.Store {
  private ready: Promise<void>

  constructor() {
    super()
    this.ready = this.ensureTable()
  }

  private async ensureTable() {
    await runSessionQuery(() =>
      sql`
        create table if not exists sessions (
          sid text primary key,
          sess json not null,
          expire timestamp not null
        )
      `
    )
  }

  override async get(
    sid: string,
    callback: (err?: unknown, session?: session.SessionData | null) => void
  ) {
    try {
      await this.ready
      const rows = await runSessionQuery(() =>
        sql`
          select sess
          from sessions
          where sid = ${sid} and expire > now()
          limit 1
        `
      )
      callback(undefined, normalizeStoredSession(rows[0]?.sess))
    } catch (error) {
      callback(error)
    }
  }

  override async set(
    sid: string,
    sess: session.SessionData,
    callback?: (err?: unknown) => void
  ) {
    try {
      await this.ready
      const maxAge = sess.cookie?.maxAge ?? config.session.maxAge
      const expire = new Date(Date.now() + Number(maxAge))
      await runSessionQuery(() =>
        sql`
          insert into sessions (sid, sess, expire)
          values (${sid}, ${JSON.stringify(sess)}, ${expire})
          on conflict (sid)
          do update set sess = excluded.sess, expire = excluded.expire
        `
      )
      callback?.()
    } catch (error) {
      callback?.(error)
    }
  }

  override async destroy(sid: string, callback?: (err?: unknown) => void) {
    try {
      await this.ready
      await runSessionQuery(() => sql`delete from sessions where sid = ${sid}`)
      callback?.()
    } catch (error) {
      callback?.(error)
    }
  }

  override async touch(
    sid: string,
    sess: session.SessionData,
    callback?: () => void
  ) {
    await this.set(sid, sess, () => callback?.())
  }
}

export function createApp() {
  const app = express()
  const isProduction = config.nodeEnv === 'production'

  if (isProduction) {
    app.set('trust proxy', 1)
  }

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
      genid: () => randomUUID(),
      name: config.cookieName,
      store: new PostgresSessionStore(),
      secret: config.session.secret,
      resave: false,
      saveUninitialized: false,
      cookie: {
        secure: isProduction,
        httpOnly: true,
        maxAge: config.session.maxAge,
        sameSite: isProduction ? 'none' : 'lax',
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

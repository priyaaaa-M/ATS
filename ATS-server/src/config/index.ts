import 'dotenv/config'

const required = (key: string): string => {
  const value = process.env[key]
  if (!value) {
    throw new Error(`Missing required env var: ${key}`)
  }
  return value
}

const optional = (key: string, fallback = ''): string =>
  process.env[key] || fallback

const optionalNumber = (key: string, fallback: number): number => {
  const value = process.env[key]
  if (!value) {
    return fallback
  }
  const parsed = Number(value)
  if (Number.isNaN(parsed)) {
    throw new Error(`Invalid number env var: ${key}`)
  }
  return parsed
}

const nodeEnv = optional('NODE_ENV', 'development')

export const config = {
  port: optionalNumber('PORT', 3000),
  nodeEnv,
  isDev: nodeEnv === 'development',
  appBaseUrl: required('APP_BASE_URL'),
  cookieName: optional('COOKIE_NAME', 'ats.sid'),
  allowedOrigins: optional(
    'ALLOWED_ORIGINS',
    'http://localhost:5173,http://localhost:3000'
  )
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean),
  sessionSecret: required('SESSION_SECRET'),
  supabase: {
    url: required('SUPABASE_URL'),
    serviceKey: required('SUPABASE_SERVICE_KEY'),
    dbUrl: required('DATABASE_URL'),
  },
  google: {
    clientId: required('GOOGLE_CLIENT_ID'),
    clientSecret: required('GOOGLE_CLIENT_SECRET'),
    redirectUri: required('GOOGLE_REDIRECT_URI'),
    scopes: [
      'https://www.googleapis.com/auth/userinfo.profile',
      'https://www.googleapis.com/auth/userinfo.email',
      'https://www.googleapis.com/auth/drive.readonly',
      'https://www.googleapis.com/auth/calendar.events',
      'https://www.googleapis.com/auth/calendar.readonly',
      'https://www.googleapis.com/auth/gmail.send',
    ],
  },
  slack: {
    webhookUrl: optional('SLACK_WEBHOOK_URL'),
  },
  readai: {
    apiKey: optional('READAI_API_KEY'),
    webhookSecret: optional('READAI_WEBHOOK_SECRET'),
  },
  session: {
    secret: required('SESSION_SECRET'),
    maxAge: 7 * 24 * 60 * 60 * 1000,
  },
  scheduling: {
    workDayStartHour: optionalNumber('WORK_DAY_START_HOUR', 9),
    workDayEndHour: optionalNumber('WORK_DAY_END_HOUR', 18),
    freeSlotIncrementMinutes: optionalNumber('FREE_SLOT_INCREMENT_MINUTES', 30),
    freeSlotBufferMinutes: optionalNumber('FREE_SLOT_BUFFER_MINUTES', 30),
    defaultInterviewDurationMinutes: optionalNumber(
      'DEFAULT_INTERVIEW_DURATION_MINUTES',
      45
    ),
  },
  jobs: {
    transcriptCron: optional('TRANSCRIPT_JOB_CRON', '*/15 * * * *'),
    transcriptFetchLookbackHours: optionalNumber(
      'TRANSCRIPT_FETCH_LOOKBACK_HOURS',
      24
    ),
    transcriptFetchDelayMinutes: optionalNumber(
      'TRANSCRIPT_FETCH_DELAY_MINUTES',
      30
    ),
  },
  sync: {
    batchSize: optionalNumber('SYNC_BATCH_SIZE', 5),
    batchDelayMs: optionalNumber('SYNC_BATCH_DELAY_MS', 500),
  },
  invite: {
    expiryDays: optionalNumber('INVITE_EXPIRY_DAYS', 7),
  },
} as const

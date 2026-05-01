declare module 'connect-pg-simple' {
  import type session from 'express-session'

  export default function connectPgSimple(
    session: typeof session
  ): new (options?: {
    conString?: string
    conObject?: {
      connectionString?: string
      ssl?: { rejectUnauthorized?: boolean }
    }
    createTableIfMissing?: boolean
  }) => session.Store
}

import type { UserRole } from './index'

declare module 'express-session' {
  interface SessionData {
    userId?: string
    userEmail?: string
    userName?: string
    userRole?: UserRole
    companyId?: string
  }
}

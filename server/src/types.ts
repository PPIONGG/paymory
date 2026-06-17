import type { User } from '@prisma/client'

// Make the logged-in user available on every request (set by requireAuth).
declare global {
  // eslint-disable-next-line @typescript-eslint/no-namespace
  namespace Express {
    interface Request {
      user?: User
    }
  }
}

// Store the user id on the session cookie.
declare module 'express-session' {
  interface SessionData {
    userId?: string
  }
}

export {}

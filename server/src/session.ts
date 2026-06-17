import session from 'express-session'
import connectPgSimple from 'connect-pg-simple'

const PgStore = connectPgSimple(session)

export const sessionMiddleware = session({
  store: new PgStore({
    conString: process.env.DATABASE_URL,
    createTableIfMissing: true, // auto-creates the "session" table
  }),
  secret: process.env.SESSION_SECRET || 'dev-secret',
  resave: false,
  saveUninitialized: false,
  cookie: {
    httpOnly: true, // JS cannot read it (XSS-safe)
    secure: process.env.NODE_ENV === 'production', // HTTPS only in production
    sameSite: 'lax',
    maxAge: 1000 * 60 * 60 * 24 * 30, // 30 days
  },
})

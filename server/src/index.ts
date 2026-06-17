import 'dotenv/config'
import './types'
import express from 'express'
import rateLimit from 'express-rate-limit'
import { sessionMiddleware } from './session'
import { authRouter } from './auth'
import { workspaceRouter } from './workspace'
import { expensesRouter } from './expenses'
import { categoriesRouter } from './categories'
import { monthlyRouter, dashboardRouter } from './summary'
import { prisma } from './prisma'

const app = express()
const PORT = Number(process.env.PORT) || 4000

app.use(express.json())
app.use(sessionMiddleware)

// Limit auth attempts to slow down brute-force.
const authLimiter = rateLimit({ windowMs: 15 * 60 * 1000, limit: 50 })
app.use('/api/auth', authLimiter)

app.get('/api/health', async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`
    res.json({ status: 'ok', db: 'connected', time: new Date().toISOString() })
  } catch (err) {
    res.status(500).json({ status: 'error', db: 'disconnected', message: String(err) })
  }
})

app.use('/api/auth', authRouter)
app.use('/api/workspace', workspaceRouter)
app.use('/api/expenses', expensesRouter)
app.use('/api/categories', categoriesRouter)
app.use('/api/monthly', monthlyRouter)
app.use('/api/dashboard', dashboardRouter)

app.listen(PORT, () => {
  console.log(`🟢 Paymory API running on http://localhost:${PORT}`)
})

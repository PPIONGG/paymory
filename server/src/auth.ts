import { Router } from 'express'
import bcrypt from 'bcryptjs'
import { z } from 'zod'
import { prisma } from './prisma'
import { requireAuth } from './middleware'

export const authRouter = Router()

function publicUser(u: { id: string; email: string; displayName: string; workspaceId: string | null }) {
  return { id: u.id, email: u.email, displayName: u.displayName, workspaceId: u.workspaceId }
}

const registerSchema = z.object({
  email: z.string().email(),
  password: z.string().min(6, 'รหัสผ่านอย่างน้อย 6 ตัว'),
  displayName: z.string().min(1).max(40),
  signupCode: z.string(),
})

authRouter.post('/register', async (req, res) => {
  const parsed = registerSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() })
  const { email, password, displayName, signupCode } = parsed.data

  if (signupCode !== process.env.SIGNUP_CODE) {
    return res.status(403).json({ error: 'รหัสสมัครไม่ถูกต้อง' })
  }
  if (await prisma.user.findUnique({ where: { email } })) {
    return res.status(409).json({ error: 'อีเมลนี้ถูกใช้แล้ว' })
  }

  const passwordHash = await bcrypt.hash(password, 10)
  const user = await prisma.user.create({ data: { email, passwordHash, displayName } })
  req.session.userId = user.id
  res.json(publicUser(user))
})

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string(),
})

authRouter.post('/login', async (req, res) => {
  const parsed = loginSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' })
  const { email, password } = parsed.data

  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
    return res.status(401).json({ error: 'อีเมลหรือรหัสผ่านไม่ถูกต้อง' })
  }
  req.session.userId = user.id
  res.json(publicUser(user))
})

authRouter.post('/logout', (req, res) => {
  req.session.destroy(() => {
    res.clearCookie('connect.sid')
    res.json({ ok: true })
  })
})

authRouter.get('/me', requireAuth, (req, res) => {
  res.json(publicUser(req.user!))
})

const changePasswordSchema = z.object({
  currentPassword: z.string(),
  newPassword: z.string().min(6, 'รหัสผ่านใหม่อย่างน้อย 6 ตัว'),
})

authRouter.post('/change-password', requireAuth, async (req, res) => {
  const parsed = changePasswordSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' })
  const user = req.user!

  if (!(await bcrypt.compare(parsed.data.currentPassword, user.passwordHash))) {
    return res.status(403).json({ error: 'รหัสผ่านปัจจุบันไม่ถูกต้อง' })
  }
  const passwordHash = await bcrypt.hash(parsed.data.newPassword, 10)
  await prisma.user.update({ where: { id: user.id }, data: { passwordHash } })
  res.json({ ok: true })
})

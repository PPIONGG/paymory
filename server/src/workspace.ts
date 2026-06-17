import { Router } from 'express'
import { z } from 'zod'
import { prisma } from './prisma'
import { requireAuth } from './middleware'
import { DEFAULT_CATEGORIES } from './categories'

export const workspaceRouter = Router()

function makeInviteCode() {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789' // no confusing 0/O/1/I
  let s = ''
  for (let i = 0; i < 8; i++) s += chars[Math.floor(Math.random() * chars.length)]
  return s
}

const createSchema = z.object({ name: z.string().min(1).max(60) })

workspaceRouter.post('/create', requireAuth, async (req, res) => {
  const user = req.user!
  if (user.workspaceId) return res.status(409).json({ error: 'คุณอยู่ใน workspace แล้ว' })
  const parsed = createSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' })

  let inviteCode = makeInviteCode()
  while (await prisma.workspace.findUnique({ where: { inviteCode } })) inviteCode = makeInviteCode()

  const workspace = await prisma.workspace.create({
    data: {
      name: parsed.data.name,
      inviteCode,
      members: { connect: { id: user.id } },
      categories: { create: DEFAULT_CATEGORIES.map((name) => ({ name })) },
    },
  })
  res.json({ id: workspace.id, name: workspace.name, inviteCode: workspace.inviteCode })
})

const joinSchema = z.object({ inviteCode: z.string().min(1) })

workspaceRouter.post('/join', requireAuth, async (req, res) => {
  const user = req.user!
  if (user.workspaceId) return res.status(409).json({ error: 'คุณอยู่ใน workspace แล้ว' })
  const parsed = joinSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' })

  const workspace = await prisma.workspace.findUnique({
    where: { inviteCode: parsed.data.inviteCode.trim().toUpperCase() },
    include: { members: true },
  })
  if (!workspace) return res.status(404).json({ error: 'ไม่พบ workspace (โค้ดไม่ถูกต้อง)' })
  if (workspace.members.length >= 2) return res.status(409).json({ error: 'workspace นี้เต็มแล้ว (สูงสุด 2 คน)' })

  await prisma.user.update({ where: { id: user.id }, data: { workspaceId: workspace.id } })
  res.json({ id: workspace.id, name: workspace.name, inviteCode: workspace.inviteCode })
})

workspaceRouter.get('/', requireAuth, async (req, res) => {
  const user = req.user!
  if (!user.workspaceId) return res.status(404).json({ error: 'no workspace' })
  const workspace = await prisma.workspace.findUnique({
    where: { id: user.workspaceId },
    include: {
      members: { select: { id: true, displayName: true, email: true } },
      categories: { orderBy: { name: 'asc' } },
    },
  })
  res.json(workspace)
})

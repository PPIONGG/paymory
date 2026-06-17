import { Router } from 'express'
import { z } from 'zod'
import { prisma } from './prisma'
import { requireAuth } from './middleware'

export const DEFAULT_CATEGORIES = [
  'Streaming',
  'Subscription',
  'Housing',
  'Vehicle',
  'Utilities',
  'Internet & Phone',
  'Home Appliances',
  'Insurance',
  'Debt / Installment',
  'Other',
]

// ===== Categories management — view / add / rename / delete =====
// Workspace-scoped; @@unique([workspaceId, name]) blocks duplicates. A category
// still used by an expense cannot be deleted (the FK would fail) — we guard with a
// friendly message instead of letting Prisma throw.

export const categoriesRouter = Router()
categoriesRouter.use(requireAuth)

const nameSchema = z.object({ name: z.string().trim().min(1).max(40) })

// LIST (with how many expenses use each)
categoriesRouter.get('/', async (req, res) => {
  const wid = req.user!.workspaceId
  if (!wid) return res.json([])
  const cats = await prisma.category.findMany({
    where: { workspaceId: wid },
    orderBy: { name: 'asc' },
    include: { _count: { select: { expenses: true } } },
  })
  res.json(cats.map((c) => ({ id: c.id, name: c.name, expenseCount: c._count.expenses })))
})

// CREATE
categoriesRouter.post('/', async (req, res) => {
  const wid = req.user!.workspaceId
  if (!wid) return res.status(400).json({ error: 'no workspace' })
  const parsed = nameSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'ชื่อหมวดหมู่ไม่ถูกต้อง (1–40 ตัวอักษร)' })
  const exists = await prisma.category.findFirst({ where: { workspaceId: wid, name: parsed.data.name } })
  if (exists) return res.status(409).json({ error: 'มีหมวดหมู่ชื่อนี้อยู่แล้ว' })
  const cat = await prisma.category.create({ data: { workspaceId: wid, name: parsed.data.name } })
  res.json({ id: cat.id, name: cat.name, expenseCount: 0 })
})

// RENAME
categoriesRouter.patch('/:id', async (req, res) => {
  const wid = req.user!.workspaceId
  if (!wid) return res.status(404).json({ error: 'ไม่พบหมวดหมู่' })
  const parsed = nameSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'ชื่อหมวดหมู่ไม่ถูกต้อง (1–40 ตัวอักษร)' })
  const existing = await prisma.category.findFirst({ where: { id: req.params.id, workspaceId: wid } })
  if (!existing) return res.status(404).json({ error: 'ไม่พบหมวดหมู่' })
  const dup = await prisma.category.findFirst({
    where: { workspaceId: wid, name: parsed.data.name, id: { not: existing.id } },
  })
  if (dup) return res.status(409).json({ error: 'มีหมวดหมู่ชื่อนี้อยู่แล้ว' })
  await prisma.category.update({ where: { id: existing.id }, data: { name: parsed.data.name } })
  const expenseCount = await prisma.recurringExpense.count({ where: { categoryId: existing.id } })
  res.json({ id: existing.id, name: parsed.data.name, expenseCount })
})

// DELETE (only when unused)
categoriesRouter.delete('/:id', async (req, res) => {
  const wid = req.user!.workspaceId
  if (!wid) return res.status(404).json({ error: 'ไม่พบหมวดหมู่' })
  const existing = await prisma.category.findFirst({ where: { id: req.params.id, workspaceId: wid } })
  if (!existing) return res.status(404).json({ error: 'ไม่พบหมวดหมู่' })
  const inUse = await prisma.recurringExpense.count({ where: { categoryId: existing.id } })
  if (inUse > 0) return res.status(409).json({ error: `ลบไม่ได้ — ยังมี ${inUse} รายการใช้หมวดนี้อยู่` })
  await prisma.category.delete({ where: { id: existing.id } })
  res.json({ ok: true })
})

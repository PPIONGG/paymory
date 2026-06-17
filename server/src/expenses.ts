import { Router } from 'express'
import { z } from 'zod'
import { prisma } from './prisma'
import { requireAuth } from './middleware'

export const expensesRouter = Router()
expensesRouter.use(requireAuth)

const upsertSchema = z.object({
  name: z.string().min(1).max(100),
  amount: z.number().positive(),
  categoryId: z.string().min(1),
  billingCycle: z.enum(['MONTHLY', 'YEARLY']),
  dueDay: z.number().int().min(1).max(31),
  dueMonth: z.number().int().min(1).max(12).nullable().optional(),
  ownerType: z.enum(['PERSONAL', 'SHARED']),
  ownerUserId: z.string().nullable().optional(),
  payerType: z.enum(['PERSONAL', 'SPLIT']),
  payerUserId: z.string().nullable().optional(),
  splitPercent: z.number().int().min(1).max(99).nullable().optional(),
  paymentMethod: z.enum(['CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'AUTO_DEBIT', 'OTHER']),
  status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']).optional(),
  notes: z.string().max(500).nullable().optional(),
  link: z.string().max(300).nullable().optional(),
})

type UpsertData = z.infer<typeof upsertSchema>

const include = {
  category: true,
  owner: { select: { id: true, displayName: true } },
  payer: { select: { id: true, displayName: true } },
}

// Ensure referenced category + members belong to this workspace.
async function validateRefs(workspaceId: string, d: UpsertData): Promise<string | null> {
  const cat = await prisma.category.findFirst({ where: { id: d.categoryId, workspaceId } })
  if (!cat) return 'หมวดหมู่ไม่ถูกต้อง'
  const members = await prisma.user.findMany({ where: { workspaceId }, select: { id: true } })
  const ids = members.map((m) => m.id)
  if (d.ownerType === 'PERSONAL' && (!d.ownerUserId || !ids.includes(d.ownerUserId))) return 'เจ้าของไม่ถูกต้อง'
  if (d.payerType === 'PERSONAL' && (!d.payerUserId || !ids.includes(d.payerUserId))) return 'ผู้จ่ายไม่ถูกต้อง'
  return null
}

function toData(workspaceId: string, d: UpsertData) {
  return {
    workspaceId,
    name: d.name,
    amount: d.amount,
    categoryId: d.categoryId,
    billingCycle: d.billingCycle,
    dueDay: d.dueDay,
    dueMonth: d.billingCycle === 'YEARLY' ? d.dueMonth ?? 1 : null,
    ownerType: d.ownerType,
    ownerUserId: d.ownerType === 'PERSONAL' ? d.ownerUserId ?? null : null,
    payerType: d.payerType,
    payerUserId: d.payerType === 'PERSONAL' ? d.payerUserId ?? null : null,
    splitPercent: d.payerType === 'SPLIT' ? d.splitPercent ?? 50 : null,
    paymentMethod: d.paymentMethod,
    status: d.status ?? 'ACTIVE',
    notes: d.notes ?? null,
    link: d.link ?? null,
  }
}

// LIST
expensesRouter.get('/', async (req, res) => {
  const wid = req.user!.workspaceId
  if (!wid) return res.json([])
  const expenses = await prisma.recurringExpense.findMany({
    where: { workspaceId: wid },
    include,
    orderBy: { createdAt: 'desc' },
  })
  res.json(expenses)
})

// GET ONE (with payment history)
expensesRouter.get('/:id', async (req, res) => {
  const wid = req.user!.workspaceId
  if (!wid) return res.status(404).json({ error: 'ไม่พบรายการ' })
  const expense = await prisma.recurringExpense.findFirst({
    where: { id: req.params.id, workspaceId: wid },
    include: {
      ...include,
      payments: {
        orderBy: [{ periodYear: 'desc' }, { periodMonth: 'desc' }],
        include: { markedBy: { select: { id: true, displayName: true } } },
      },
    },
  })
  if (!expense) return res.status(404).json({ error: 'ไม่พบรายการ' })
  res.json(expense)
})

// CREATE
expensesRouter.post('/', async (req, res) => {
  const wid = req.user!.workspaceId
  if (!wid) return res.status(400).json({ error: 'no workspace' })
  const parsed = upsertSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() })
  const err = await validateRefs(wid, parsed.data)
  if (err) return res.status(400).json({ error: err })
  const expense = await prisma.recurringExpense.create({ data: toData(wid, parsed.data), include })
  res.json(expense)
})

// UPDATE (full)
expensesRouter.patch('/:id', async (req, res) => {
  const wid = req.user!.workspaceId
  if (!wid) return res.status(404).json({ error: 'ไม่พบรายการ' })
  const existing = await prisma.recurringExpense.findFirst({ where: { id: req.params.id, workspaceId: wid } })
  if (!existing) return res.status(404).json({ error: 'ไม่พบรายการ' })
  const parsed = upsertSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง', details: parsed.error.flatten() })
  const err = await validateRefs(wid, parsed.data)
  if (err) return res.status(400).json({ error: err })
  const { workspaceId, ...data } = toData(wid, parsed.data)
  const expense = await prisma.recurringExpense.update({ where: { id: req.params.id }, data, include })
  res.json(expense)
})

// STATUS (quick: active / paused / cancelled)
const statusSchema = z.object({ status: z.enum(['ACTIVE', 'PAUSED', 'CANCELLED']) })
expensesRouter.patch('/:id/status', async (req, res) => {
  const wid = req.user!.workspaceId
  if (!wid) return res.status(404).json({ error: 'ไม่พบรายการ' })
  const existing = await prisma.recurringExpense.findFirst({ where: { id: req.params.id, workspaceId: wid } })
  if (!existing) return res.status(404).json({ error: 'ไม่พบรายการ' })
  const parsed = statusSchema.safeParse(req.body)
  if (!parsed.success) return res.status(400).json({ error: 'ข้อมูลไม่ถูกต้อง' })
  const expense = await prisma.recurringExpense.update({
    where: { id: req.params.id },
    data: { status: parsed.data.status },
    include,
  })
  res.json(expense)
})

// ---- Payments: mark a period paid / un-mark ----

function parsePeriod(yearStr: string, monthStr: string): { year: number; month: number } | null {
  const year = Number(yearStr)
  const month = Number(monthStr)
  if (!Number.isInteger(year) || year < 2000 || year > 2100) return null
  if (!Number.isInteger(month) || month < 1 || month > 12) return null
  return { year, month }
}

// MARK PAID — snapshots the expense's current amount for that period. Idempotent:
// re-marking keeps the original snapshot (unique on expense + period).
expensesRouter.post('/:id/payments/:year/:month', async (req, res) => {
  const wid = req.user!.workspaceId
  if (!wid) return res.status(404).json({ error: 'ไม่พบรายการ' })
  const period = parsePeriod(req.params.year, req.params.month)
  if (!period) return res.status(400).json({ error: 'ช่วงเวลาไม่ถูกต้อง' })
  const expense = await prisma.recurringExpense.findFirst({ where: { id: req.params.id, workspaceId: wid } })
  if (!expense) return res.status(404).json({ error: 'ไม่พบรายการ' })

  const payment = await prisma.payment.upsert({
    where: {
      expenseId_periodYear_periodMonth: {
        expenseId: expense.id,
        periodYear: period.year,
        periodMonth: period.month,
      },
    },
    update: {}, // already paid → keep the original snapshot
    create: {
      workspaceId: wid,
      expenseId: expense.id,
      periodYear: period.year,
      periodMonth: period.month,
      amountPaid: expense.amount,
      markedByUserId: req.user!.id,
    },
  })
  res.json(payment)
})

// UN-MARK — removes the Payment for that period.
expensesRouter.delete('/:id/payments/:year/:month', async (req, res) => {
  const wid = req.user!.workspaceId
  if (!wid) return res.status(404).json({ error: 'ไม่พบรายการ' })
  const period = parsePeriod(req.params.year, req.params.month)
  if (!period) return res.status(400).json({ error: 'ช่วงเวลาไม่ถูกต้อง' })
  const existing = await prisma.payment.findFirst({
    where: { expenseId: req.params.id, workspaceId: wid, periodYear: period.year, periodMonth: period.month },
  })
  if (!existing) return res.status(404).json({ error: 'ไม่พบการจ่าย' })
  await prisma.payment.delete({ where: { id: existing.id } })
  res.json({ ok: true })
})

// DELETE (permanent)
expensesRouter.delete('/:id', async (req, res) => {
  const wid = req.user!.workspaceId
  if (!wid) return res.status(404).json({ error: 'ไม่พบรายการ' })
  const existing = await prisma.recurringExpense.findFirst({ where: { id: req.params.id, workspaceId: wid } })
  if (!existing) return res.status(404).json({ error: 'ไม่พบรายการ' })
  await prisma.recurringExpense.delete({ where: { id: req.params.id } })
  res.json({ ok: true })
})

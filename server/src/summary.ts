import { Router } from 'express'
import { z } from 'zod'
import { prisma } from './prisma'
import { requireAuth } from './middleware'
import * as compute from './compute'

// Two read-only views computed live from the active RecurringExpenses + their Payments.
// Nothing here is materialised — see docs/adr/0002.

export const monthlyRouter = Router()
export const dashboardRouter = Router()
monthlyRouter.use(requireAuth)
dashboardRouter.use(requireAuth)

const memberSelect = { select: { id: true, displayName: true } }
const expenseInclude = { category: true, owner: memberSelect, payer: memberSelect }

// ===== Monthly View — GET /api/monthly?year=&month= =====
// Lists the ACTIVE expenses due in the chosen month, each flagged
// PAID / OVERDUE / UPCOMING, sorted by due day, with that month's total.

const monthQuery = z.object({
  year: z.coerce.number().int().min(2000).max(2100),
  month: z.coerce.number().int().min(1).max(12),
})

monthlyRouter.get('/', async (req, res) => {
  const wid = req.user!.workspaceId
  const now = new Date()
  const parsed = monthQuery.safeParse(req.query)
  const year = parsed.success ? parsed.data.year : now.getFullYear()
  const month = parsed.success ? parsed.data.month : now.getMonth() + 1
  if (!wid) return res.json({ year, month, total: 0, items: [] })

  const expenses = await prisma.recurringExpense.findMany({
    where: { workspaceId: wid, status: 'ACTIVE' },
    include: {
      ...expenseInclude,
      payments: { where: { periodYear: year, periodMonth: month } },
    },
  })

  const items = expenses
    .filter((e) => compute.isDueInMonth(e.billingCycle, e.dueMonth, month))
    .map((e) => {
      const { payments, ...rest } = e
      const payment = payments[0] ?? null
      return {
        ...rest,
        effectiveDueDay: compute.effectiveDueDay(year, month, e.dueDay),
        state: compute.dueState(year, month, e.dueDay, !!payment, now),
        payment,
      }
    })
    .sort((a, b) => a.effectiveDueDay - b.effectiveDueDay)

  // Month total = what the month actually costs: snapshot for paid items, current price otherwise.
  const total = items.reduce(
    (sum, it) => sum + Number(it.payment ? it.payment.amountPaid : it.amount),
    0,
  )

  res.json({ year, month, total, items })
})

// ===== Dashboard — GET /api/dashboard =====
// Workspace-wide aggregates over ACTIVE expenses only (paused/cancelled excluded).

dashboardRouter.get('/', async (req, res) => {
  const wid = req.user!.workspaceId
  const now = new Date()
  const year = now.getFullYear()
  const month = now.getMonth() + 1

  if (!wid) {
    return res.json({
      monthlyAverage: 0, yearlyEstimate: 0, activeCount: 0,
      sharedMonthly: 0, personalMonthly: 0, perMember: [],
      thisMonth: { year, month, paidCount: 0, dueCount: 0, total: 0, overdue: [], upcoming: [] },
      nextDue: null,
    })
  }

  // Members ordered by creation — index 0 is the "first member" splitPercent refers to.
  const members = await prisma.user.findMany({
    where: { workspaceId: wid },
    orderBy: { createdAt: 'asc' },
    select: { id: true, displayName: true },
  })

  const active = await prisma.recurringExpense.findMany({
    where: { workspaceId: wid, status: 'ACTIVE' },
    include: { payments: { where: { periodYear: year, periodMonth: month } } },
  })

  let monthlyAverage = 0
  let yearlyEstimate = 0
  let sharedMonthly = 0
  let personalMonthly = 0
  const paidByMember: Record<string, number> = Object.fromEntries(members.map((m) => [m.id, 0]))

  for (const e of active) {
    const amount = Number(e.amount)
    const mNorm = compute.monthlyNormalized(e.billingCycle, amount)
    monthlyAverage += mNorm
    yearlyEstimate += compute.yearlyNormalized(e.billingCycle, amount)
    if (e.ownerType === 'SHARED') sharedMonthly += mNorm
    else personalMonthly += mNorm

    // Who pays, normalised per month.
    if (e.payerType === 'SPLIT') {
      const [first, second] = compute.splitFractions(e.splitPercent)
      if (members[0]) paidByMember[members[0].id] += mNorm * first
      if (members[1]) paidByMember[members[1].id] += mNorm * second
    } else if (e.payerUserId && e.payerUserId in paidByMember) {
      paidByMember[e.payerUserId] += mNorm
    }
  }

  // This month's due breakdown.
  let paidCount = 0
  let dueTotal = 0
  const overdue: { expenseId: string; name: string; amount: number; day: number }[] = []
  const upcoming: typeof overdue = []
  const dueThisMonth = active.filter((e) => compute.isDueInMonth(e.billingCycle, e.dueMonth, month))
  for (const e of dueThisMonth) {
    const payment = e.payments[0] ?? null
    const state = compute.dueState(year, month, e.dueDay, !!payment, now)
    dueTotal += Number(payment ? payment.amountPaid : e.amount)
    const lite = {
      expenseId: e.id,
      name: e.name,
      amount: Number(e.amount),
      day: compute.effectiveDueDay(year, month, e.dueDay),
    }
    if (state === 'PAID') paidCount++
    else if (state === 'OVERDUE') overdue.push(lite)
    else upcoming.push(lite)
  }
  overdue.sort((a, b) => a.day - b.day)
  upcoming.sort((a, b) => a.day - b.day)

  // Soonest upcoming occurrence across all active expenses.
  let nextDue: { expenseId: string; name: string; amount: number; year: number; month: number; day: number } | null = null
  let nextDueTime = Infinity
  for (const e of active) {
    const d = compute.nextDueDate(e.billingCycle, e.dueDay, e.dueMonth, now)
    if (d.getTime() < nextDueTime) {
      nextDueTime = d.getTime()
      nextDue = {
        expenseId: e.id,
        name: e.name,
        amount: Number(e.amount),
        year: d.getFullYear(),
        month: d.getMonth() + 1,
        day: d.getDate(),
      }
    }
  }

  res.json({
    monthlyAverage,
    yearlyEstimate,
    activeCount: active.length,
    sharedMonthly,
    personalMonthly,
    perMember: members.map((m) => ({ userId: m.id, displayName: m.displayName, monthly: paidByMember[m.id] })),
    thisMonth: { year, month, paidCount, dueCount: dueThisMonth.length, total: dueTotal, overdue, upcoming },
    nextDue,
  })
})

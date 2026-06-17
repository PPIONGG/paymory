// Pure, dependency-free helpers for the Phase 4 due/payment + dashboard logic.
// Kept Prisma-free on purpose: the fiddly date/money rules live here so they are
// easy to reason about (and to unit-test later) without a database.
//
// Timezone note: "today" is taken from the server's local clock (new Date()).
// In dev that is the user's Thailand machine; on the VPS set TZ=Asia/Bangkok.

export type Cycle = 'MONTHLY' | 'YEARLY'
export type DueState = 'PAID' | 'OVERDUE' | 'UPCOMING'

/** Number of days in a given month. `month` is 1–12. */
export function daysInMonth(year: number, month: number): number {
  // Day 0 of the next month === last day of this month.
  return new Date(year, month, 0).getDate()
}

/** A due day clamped to the month's length (e.g. 31 → 28/29 Feb, 30 Apr). */
export function effectiveDueDay(year: number, month: number, dueDay: number): number {
  return Math.min(dueDay, daysInMonth(year, month))
}

/** Does an expense land in the given month? Monthly = always; Yearly = only its dueMonth. */
export function isDueInMonth(cycle: Cycle, dueMonth: number | null, month: number): boolean {
  return cycle === 'MONTHLY' ? true : dueMonth === month
}

/** State of one due expense within its month, relative to `today`. */
export function dueState(
  year: number,
  month: number,
  dueDay: number,
  isPaid: boolean,
  today: Date,
): DueState {
  if (isPaid) return 'PAID'
  const day = effectiveDueDay(year, month, dueDay)
  const due = new Date(year, month - 1, day).getTime()
  const todayMidnight = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  return due < todayMidnight ? 'OVERDUE' : 'UPCOMING'
}

/** Normalised per-month cost: monthly as-is, yearly ÷ 12. */
export function monthlyNormalized(cycle: Cycle, amount: number): number {
  return cycle === 'YEARLY' ? amount / 12 : amount
}

/** Annualised cost: monthly × 12, yearly as-is. */
export function yearlyNormalized(cycle: Cycle, amount: number): number {
  return cycle === 'YEARLY' ? amount : amount * 12
}

/** The next occurrence date on/after `today` for an active expense. */
export function nextDueDate(
  cycle: Cycle,
  dueDay: number,
  dueMonth: number | null,
  today: Date,
): Date {
  const todayMid = new Date(today.getFullYear(), today.getMonth(), today.getDate()).getTime()
  const occurrence = (y: number, m: number) => new Date(y, m - 1, effectiveDueDay(y, m, dueDay))

  if (cycle === 'MONTHLY') {
    let y = today.getFullYear()
    let m = today.getMonth() + 1
    if (occurrence(y, m).getTime() < todayMid) {
      m += 1
      if (m > 12) { m = 1; y += 1 }
    }
    return occurrence(y, m)
  }

  // YEARLY — find the next year whose dueMonth/dueDay is not already past.
  const dm = dueMonth ?? 1
  let y = today.getFullYear()
  if (occurrence(y, dm).getTime() < todayMid) y += 1
  return occurrence(y, dm)
}

/**
 * Split shares as fractions (0–1): [firstMemberShare, secondMemberShare].
 * `splitPercent` is the first member's share; the other pays the rest. Default 50/50.
 */
export function splitFractions(splitPercent: number | null): [number, number] {
  const p = (splitPercent ?? 50) / 100
  return [p, 1 - p]
}

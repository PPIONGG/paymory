export type Member = { id: string; displayName: string; email?: string }

export type Category = { id: string; name: string }

export type BillingCycle = 'MONTHLY' | 'YEARLY'
export type OwnerType = 'PERSONAL' | 'SHARED'
export type PayerType = 'PERSONAL' | 'SPLIT'
export type ExpenseStatus = 'ACTIVE' | 'PAUSED' | 'CANCELLED'
export type PaymentMethod = 'CREDIT_CARD' | 'BANK_TRANSFER' | 'CASH' | 'AUTO_DEBIT' | 'OTHER'

export type Expense = {
  id: string
  name: string
  amount: string // Prisma Decimal serialises to a string
  currency: string
  categoryId: string
  category: Category
  billingCycle: BillingCycle
  dueDay: number
  dueMonth: number | null
  ownerType: OwnerType
  ownerUserId: string | null
  owner: Member | null
  payerType: PayerType
  payerUserId: string | null
  payer: Member | null
  splitPercent: number | null
  paymentMethod: PaymentMethod
  status: ExpenseStatus
  notes: string | null
  link: string | null
}

export type Workspace = {
  id: string
  name: string
  inviteCode: string
  members: Member[]
  categories: Category[]
}

export type DueState = 'PAID' | 'OVERDUE' | 'UPCOMING'

export type Payment = {
  id: string
  expenseId: string
  workspaceId: string
  periodYear: number
  periodMonth: number
  amountPaid: string // Decimal serialises to a string
  paidAt: string
  markedByUserId: string
  markedBy?: Member // included on the Expense Detail view
}

// Expense plus its payment history (GET /api/expenses/:id).
export type ExpenseDetail = Expense & { payments: Payment[] }

export type CategoryWithCount = { id: string; name: string; expenseCount: number }

// One row in the Monthly View: the expense plus its computed state for that month.
export type MonthlyItem = Expense & {
  effectiveDueDay: number
  state: DueState
  payment: Payment | null
}

export type MonthlyView = {
  year: number
  month: number
  total: number
  items: MonthlyItem[]
}

export type DueLite = { expenseId: string; name: string; amount: number; day: number }

export type Dashboard = {
  monthlyAverage: number
  yearlyEstimate: number
  activeCount: number
  sharedMonthly: number
  personalMonthly: number
  perMember: { userId: string; displayName: string; monthly: number }[]
  thisMonth: {
    year: number
    month: number
    paidCount: number
    dueCount: number
    total: number
    overdue: DueLite[]
    upcoming: DueLite[]
  }
  nextDue: { expenseId: string; name: string; amount: number; year: number; month: number; day: number } | null
}

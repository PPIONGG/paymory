import type { Expense } from './types'

export const formatTHB = (n: string | number) =>
  Number(n).toLocaleString('th-TH', { maximumFractionDigits: 2 }) + ' ฿'

export const PAYMENT_METHODS: Record<string, string> = {
  CREDIT_CARD: 'บัตรเครดิต',
  BANK_TRANSFER: 'โอนเงิน',
  CASH: 'เงินสด',
  AUTO_DEBIT: 'ตัดอัตโนมัติ',
  OTHER: 'อื่น ๆ',
}

export const CYCLE_LABELS: Record<string, string> = {
  MONTHLY: 'รายเดือน',
  YEARLY: 'รายปี',
}

export const STATUS_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  ACTIVE: { label: 'ใช้อยู่', color: '#2e7d32', bg: '#e8f5e9' },
  PAUSED: { label: 'พักไว้', color: '#9a6a00', bg: '#fff7e0' },
  CANCELLED: { label: 'เลิกแล้ว', color: '#888', bg: '#f0f0f0' },
}

export function ownerLabel(e: Expense, myId?: string) {
  if (e.ownerType === 'SHARED') return 'ของเรา'
  return e.ownerUserId === myId ? 'ของฉัน' : 'ของแฟน'
}

export function payerLabel(e: Expense, myId?: string) {
  if (e.payerType === 'SPLIT') {
    const p = e.splitPercent ?? 50
    return `หารกัน ${p}/${100 - p}`
  }
  return e.payerUserId === myId ? 'ฉันจ่าย' : 'แฟนจ่าย'
}

export const THAI_MONTHS = [
  'มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน',
  'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม',
]

// e.g. (2026, 3, 10) -> "10 มีนาคม 2026"
export const formatThaiDate = (year: number, month: number, day: number) =>
  `${day} ${THAI_MONTHS[month - 1]} ${year}`

// ISO timestamp -> "10 มิถุนายน 2026"
export const formatThaiDateISO = (iso: string) => {
  const d = new Date(iso)
  return formatThaiDate(d.getFullYear(), d.getMonth() + 1, d.getDate())
}

// Annualised cost of one expense: monthly × 12, yearly as-is.
export const annualized = (cycle: string, amount: string | number) =>
  cycle === 'YEARLY' ? Number(amount) : Number(amount) * 12

// Per-month-equivalent cost: monthly as-is, yearly ÷ 12.
export const perMonth = (cycle: string, amount: string | number) =>
  cycle === 'YEARLY' ? Number(amount) / 12 : Number(amount)

export const DUE_STATE_LABELS: Record<string, { label: string; color: string; bg: string }> = {
  PAID: { label: 'จ่ายแล้ว', color: '#2e7d32', bg: '#e8f5e9' },
  OVERDUE: { label: 'เลยกำหนด', color: '#c62828', bg: '#fdecea' },
  UPCOMING: { label: 'ใกล้ถึง', color: '#9a6a00', bg: '#fff7e0' },
}

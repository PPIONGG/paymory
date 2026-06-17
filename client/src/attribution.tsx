import type { ReactNode } from 'react'
import type { Expense } from './types'

// The signature of Paymory: an expense belongs to two people. Owner (Mine/Partner/
// Shared) and Paid-by (Mine/Partner/Split) are shown as coloured chips so the two
// people read at a glance — Mine = terracotta, Partner = teal, Shared = warm gold.
// A SPLIT payer becomes a two-tone bar that makes the division visible, not textual.

type Tone = 'mine' | 'partner' | 'shared'

const TONE: Record<Tone, { color: string; bg: string }> = {
  mine: { color: 'var(--mine)', bg: 'var(--mine-soft)' },
  partner: { color: 'var(--partner)', bg: 'var(--partner-soft)' },
  shared: { color: 'var(--shared)', bg: 'var(--shared-soft)' },
}

export function Chip({ tone, children }: { tone: Tone; children: ReactNode }) {
  const t = TONE[tone]
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 5,
        fontSize: '0.74rem',
        fontWeight: 600,
        color: t.color,
        background: t.bg,
        padding: '2px 9px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ width: 6, height: 6, borderRadius: '50%', background: 'currentColor' }} />
      {children}
    </span>
  )
}

export function OwnerChip({ e, myId }: { e: Expense; myId?: string }) {
  if (e.ownerType === 'SHARED') return <Chip tone="shared">ของเรา</Chip>
  const mine = e.ownerUserId === myId
  return <Chip tone={mine ? 'mine' : 'partner'}>{mine ? 'ของฉัน' : 'ของแฟน'}</Chip>
}

export function PayerChip({ e, myId }: { e: Expense; myId?: string }) {
  if (e.payerType === 'SPLIT') return <SplitBadge percent={e.splitPercent ?? 50} />
  const mine = e.payerUserId === myId
  return <Chip tone={mine ? 'mine' : 'partner'}>{mine ? 'ฉันจ่าย' : 'แฟนจ่าย'}</Chip>
}

// Compact two-tone proportion + ratio, for list rows.
export function SplitBadge({ percent }: { percent: number }) {
  const me = percent
  const partner = 100 - percent
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: 6,
        fontSize: '0.74rem',
        fontWeight: 600,
        color: 'var(--text-soft)',
        background: '#f3f0ea',
        padding: '2px 9px 2px 7px',
        borderRadius: 20,
        whiteSpace: 'nowrap',
      }}
    >
      <span style={{ display: 'inline-flex', width: 30, height: 7, borderRadius: 4, overflow: 'hidden' }}>
        <span style={{ width: `${me}%`, background: 'var(--mine)' }} />
        <span style={{ width: `${partner}%`, background: 'var(--partner)' }} />
      </span>
      หาร {me}/{partner}
    </span>
  )
}

// Full-width split visual with labels, for the detail page.
export function SplitBar({ percent }: { percent: number }) {
  const me = percent
  const partner = 100 - percent
  return (
    <div style={{ width: '100%' }}>
      <div style={{ display: 'flex', height: 10, borderRadius: 6, overflow: 'hidden' }}>
        <div style={{ width: `${me}%`, background: 'var(--mine)' }} />
        <div style={{ width: `${partner}%`, background: 'var(--partner)' }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', marginTop: 6 }}>
        <span style={{ color: 'var(--mine)', fontWeight: 600 }}>ฉัน {me}%</span>
        <span style={{ color: 'var(--partner)', fontWeight: 600 }}>แฟน {partner}%</span>
      </div>
    </div>
  )
}

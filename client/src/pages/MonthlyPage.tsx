import { useEffect, useState } from 'react'
import { useAuth } from '../auth'
import { api } from '../api'
import type { MonthlyView, MonthlyItem } from '../types'
import { formatTHB, THAI_MONTHS, DUE_STATE_LABELS } from '../helpers'
import { OwnerChip, PayerChip } from '../attribution'
import { LoadingCards, EmptyState, ErrorState } from '../states'
import AppShell from './AppShell'

export default function MonthlyPage() {
  const { user } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1)
  const [data, setData] = useState<MonthlyView | null>(null)
  const [error, setError] = useState('')
  const [busyId, setBusyId] = useState<string | null>(null)

  async function load(y = year, m = month) {
    setError('')
    try {
      setData(await api.get(`/monthly?year=${y}&month=${m}`))
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    setData(null)
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [year, month])

  function shiftMonth(delta: number) {
    let m = month + delta
    let y = year
    if (m < 1) { m = 12; y -= 1 }
    if (m > 12) { m = 1; y += 1 }
    setYear(y)
    setMonth(m)
  }
  function goToday() {
    setYear(now.getFullYear())
    setMonth(now.getMonth() + 1)
  }
  const isCurrentMonth = year === now.getFullYear() && month === now.getMonth() + 1

  async function togglePaid(it: MonthlyItem) {
    setBusyId(it.id)
    setError('')
    try {
      if (it.state === 'PAID') {
        await api.del(`/expenses/${it.id}/payments/${year}/${month}`)
      } else {
        await api.post(`/expenses/${it.id}/payments/${year}/${month}`)
      }
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusyId(null)
    }
  }

  const paidCount = data?.items.filter((i) => i.state === 'PAID').length ?? 0

  return (
    <AppShell>
      {/* Month switcher */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
        <button className="link-action" onClick={() => shiftMonth(-1)} aria-label="เดือนก่อน">‹</button>
        <div style={{ textAlign: 'center' }}>
          <div style={{ fontSize: '1.25rem', fontWeight: 700 }}>
            {THAI_MONTHS[month - 1]} {year}
          </div>
          {!isCurrentMonth && (
            <button className="link-action" style={{ marginTop: 4, fontSize: '0.75rem' }} onClick={goToday}>
              กลับเดือนนี้
            </button>
          )}
        </div>
        <button className="link-action" onClick={() => shiftMonth(1)} aria-label="เดือนถัดไป">›</button>
      </div>

      {/* Month total */}
      <div className="card" style={{ padding: 18, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <div className="muted" style={{ fontSize: '0.85rem' }}>ยอดรวมเดือนนี้</div>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>{formatTHB(data?.total ?? 0)}</div>
        </div>
        {data && data.items.length > 0 && (
          <div style={{ textAlign: 'right', color: 'var(--text-soft)', fontSize: '0.9rem' }}>
            จ่ายแล้ว<br />
            <span style={{ fontSize: '1.2rem', fontWeight: 600, color: 'var(--text)' }}>
              {paidCount}/{data.items.length}
            </span> รายการ
          </div>
        )}
      </div>

      {error && data !== null && <div className="error">{error}</div>}

      {data === null ? (
        error ? <ErrorState message={error} onRetry={() => load()} /> : <LoadingCards />
      ) : data.items.length === 0 ? (
        <EmptyState icon="🎉" title="ไม่มีรายการครบกำหนดในเดือนนี้" hint="เดือนนี้สบาย ๆ ไม่มีบิลที่ต้องจ่าย" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
          {data.items.map((it) => {
            const badge = DUE_STATE_LABELS[it.state]
            const paid = it.state === 'PAID'
            const shownAmount = it.payment ? it.payment.amountPaid : it.amount
            return (
              <div key={it.id} className="card" style={{ padding: 14, display: 'flex', gap: 12, alignItems: 'center' }}>
                {/* due-day chip */}
                <div
                  style={{
                    flexShrink: 0,
                    width: 46,
                    height: 46,
                    borderRadius: 12,
                    background: badge.bg,
                    color: badge.color,
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    lineHeight: 1,
                  }}
                >
                  <span style={{ fontSize: '1.2rem', fontWeight: 700 }}>{it.effectiveDueDay}</span>
                  <span style={{ fontSize: '0.6rem', marginTop: 2 }}>{THAI_MONTHS[month - 1].slice(0, 3)}</span>
                </div>

                {/* name + meta */}
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600 }}>{it.name}</div>
                  <div className="muted" style={{ fontSize: '0.82rem', marginTop: 2 }}>{it.category?.name}</div>
                  <div style={{ display: 'flex', gap: 6, marginTop: 6, flexWrap: 'wrap', alignItems: 'center' }}>
                    <span
                      style={{
                        fontSize: '0.72rem',
                        color: badge.color,
                        background: badge.bg,
                        padding: '2px 8px',
                        borderRadius: 20,
                      }}
                    >
                      {badge.label}
                    </span>
                    <OwnerChip e={it} myId={user?.id} />
                    <PayerChip e={it} myId={user?.id} />
                  </div>
                </div>

                {/* amount + action */}
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatTHB(shownAmount)}</div>
                  <button
                    className={paid ? 'link-action' : 'btn'}
                    style={
                      paid
                        ? { marginTop: 8, fontSize: '0.8rem' }
                        : { marginTop: 8, width: 'auto', padding: '7px 14px', fontSize: '0.85rem' }
                    }
                    disabled={busyId === it.id}
                    onClick={() => togglePaid(it)}
                  >
                    {busyId === it.id ? '…' : paid ? 'ยกเลิกจ่าย' : 'จ่ายแล้ว'}
                  </button>
                </div>
              </div>
            )
          })}
        </div>
      )}
    </AppShell>
  )
}

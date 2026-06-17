import { useEffect, useState, type ReactNode } from 'react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { api } from '../api'
import type { ExpenseDetail } from '../types'
import {
  formatTHB,
  STATUS_LABELS,
  CYCLE_LABELS,
  PAYMENT_METHODS,
  THAI_MONTHS,
  annualized,
  perMonth,
  formatThaiDateISO,
} from '../helpers'
import { OwnerChip, PayerChip, SplitBar } from '../attribution'
import { LoadingCards, EmptyState } from '../states'
import AppShell from './AppShell'

function Row({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div
      style={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 12,
        padding: '10px 0',
        borderBottom: '1px solid var(--border)',
      }}
    >
      <span className="muted" style={{ fontSize: '0.9rem' }}>{label}</span>
      <span style={{ textAlign: 'right', fontWeight: 500 }}>{children}</span>
    </div>
  )
}

const backBtn = {
  background: 'none',
  border: 'none',
  cursor: 'pointer',
  marginBottom: 12,
  fontSize: '0.9rem',
} as const

export default function ExpenseDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { user } = useAuth()
  const [e, setE] = useState<ExpenseDetail | null>(null)
  const [error, setError] = useState('')
  const [notFound, setNotFound] = useState(false)
  const [busy, setBusy] = useState(false)

  async function load() {
    setError('')
    try {
      setE(await api.get(`/expenses/${id}`))
    } catch (err) {
      setNotFound(true)
      setError((err as Error).message)
    }
  }
  useEffect(() => {
    load()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  async function changeStatus(status: string) {
    setBusy(true)
    setError('')
    try {
      await api.patch(`/expenses/${id}/status`, { status })
      await load()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function remove() {
    if (!e) return
    if (!window.confirm(`ลบ "${e.name}" ถาวร? (กู้คืนไม่ได้ และประวัติการจ่ายจะหายไปด้วย)`)) return
    setBusy(true)
    setError('')
    try {
      await api.del(`/expenses/${id}`)
      navigate('/expenses')
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  if (notFound) {
    return (
      <AppShell>
        <button onClick={() => navigate('/expenses')} className="muted" style={backBtn}>← กลับ</button>
        <EmptyState icon="🔍" title="ไม่พบรายการนี้" hint="รายการนี้อาจถูกลบไปแล้ว" />
      </AppShell>
    )
  }
  if (!e) {
    return (
      <AppShell>
        <button onClick={() => navigate('/expenses')} className="muted" style={backBtn}>← กลับ</button>
        <LoadingCards count={2} />
      </AppShell>
    )
  }

  const st = STATUS_LABELS[e.status]

  return (
    <AppShell>
      <button onClick={() => navigate('/expenses')} className="muted" style={backBtn}>← กลับ</button>

      {/* Header + actions */}
      <div className="card" style={{ marginBottom: 16, opacity: e.status === 'CANCELLED' ? 0.75 : 1 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 6px' }}>{e.name}</h2>
            <span style={{ fontSize: '0.72rem', color: st.color, background: st.bg, padding: '2px 8px', borderRadius: 20 }}>
              {st.label}
            </span>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '1.6rem', fontWeight: 700, whiteSpace: 'nowrap' }}>{formatTHB(e.amount)}</div>
            <div className="muted" style={{ fontSize: '0.85rem' }}>{CYCLE_LABELS[e.billingCycle]}</div>
          </div>
        </div>

        <div style={{ display: 'flex', gap: 8, marginTop: 16, flexWrap: 'wrap' }}>
          <Link to={`/expenses/${e.id}/edit`} className="link-action">แก้ไข</Link>
          {e.status === 'ACTIVE' && (
            <button className="link-action" disabled={busy} onClick={() => changeStatus('PAUSED')}>พัก</button>
          )}
          {e.status === 'PAUSED' && (
            <button className="link-action" disabled={busy} onClick={() => changeStatus('ACTIVE')}>ใช้ต่อ</button>
          )}
          {e.status !== 'CANCELLED' ? (
            <button className="link-action" disabled={busy} onClick={() => changeStatus('CANCELLED')}>เลิก</button>
          ) : (
            <button className="link-action" disabled={busy} onClick={() => changeStatus('ACTIVE')}>เปิดใหม่</button>
          )}
          <button className="link-action danger" disabled={busy} onClick={remove}>ลบ</button>
        </div>
      </div>

      {/* Annualised estimate */}
      <div className="card" style={{ marginBottom: 16, display: 'flex', justifyContent: 'space-around', textAlign: 'center', padding: 18 }}>
        <div>
          <div className="muted" style={{ fontSize: '0.8rem' }}>ประเมินต่อเดือน</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2 }}>{formatTHB(perMonth(e.billingCycle, e.amount))}</div>
        </div>
        <div style={{ width: 1, background: 'var(--border)' }} />
        <div>
          <div className="muted" style={{ fontSize: '0.8rem' }}>ประเมินต่อปี</div>
          <div style={{ fontSize: '1.2rem', fontWeight: 700, marginTop: 2 }}>{formatTHB(annualized(e.billingCycle, e.amount))}</div>
        </div>
      </div>

      {/* Full details */}
      <div className="card" style={{ marginBottom: 20, paddingTop: 6, paddingBottom: 6 }}>
        <Row label="หมวดหมู่">{e.category?.name}</Row>
        <Row label="รอบบิล">{CYCLE_LABELS[e.billingCycle]}</Row>
        {e.billingCycle === 'YEARLY' && e.dueMonth && <Row label="เดือนที่จ่าย">{THAI_MONTHS[e.dueMonth - 1]}</Row>}
        <Row label="วันครบกำหนด">วันที่ {e.dueDay}</Row>
        <Row label="เจ้าของ"><OwnerChip e={e} myId={user?.id} /></Row>
        {e.payerType === 'SPLIT' ? (
          <div style={{ padding: '10px 0', borderBottom: '1px solid var(--border)' }}>
            <div className="muted" style={{ fontSize: '0.9rem', marginBottom: 8 }}>ผู้จ่าย — หารกัน</div>
            <SplitBar percent={e.splitPercent ?? 50} />
          </div>
        ) : (
          <Row label="ผู้จ่าย"><PayerChip e={e} myId={user?.id} /></Row>
        )}
        <Row label="ช่องทางจ่าย">{PAYMENT_METHODS[e.paymentMethod]}</Row>
        {e.notes && <Row label="โน้ต">{e.notes}</Row>}
        {e.link && (
          <Row label="ลิงก์">
            <a href={e.link} target="_blank" rel="noreferrer">เปิดลิงก์ ↗</a>
          </Row>
        )}
      </div>

      {/* Payment history */}
      <h3 style={{ margin: '0 0 10px', fontSize: '1.1rem' }}>
        ประวัติการจ่าย {e.payments.length > 0 && <span className="muted" style={{ fontWeight: 400 }}>({e.payments.length})</span>}
      </h3>
      {e.payments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', color: 'var(--text-soft)' }}>ยังไม่มีประวัติการจ่าย</div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {e.payments.map((p) => (
            <div key={p.id} className="card" style={{ padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <div style={{ fontWeight: 600 }}>{THAI_MONTHS[p.periodMonth - 1]} {p.periodYear}</div>
                <div className="muted" style={{ fontSize: '0.8rem', marginTop: 2 }}>
                  จ่ายเมื่อ {formatThaiDateISO(p.paidAt)}
                  {p.markedBy ? ` · โดย ${p.markedBy.displayName}` : ''}
                </div>
              </div>
              <div style={{ fontWeight: 700, whiteSpace: 'nowrap' }}>{formatTHB(p.amountPaid)}</div>
            </div>
          ))}
        </div>
      )}

      {error && <div className="error" style={{ marginTop: 12 }}>{error}</div>}
    </AppShell>
  )
}

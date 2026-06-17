import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { api } from '../api'
import type { Expense } from '../types'
import { formatTHB, STATUS_LABELS, CYCLE_LABELS } from '../helpers'
import { OwnerChip, PayerChip } from '../attribution'
import { LoadingCards, EmptyState, ErrorState } from '../states'
import AppShell from './AppShell'

const selStyle = {
  flex: '1 1 auto',
  minWidth: 0,
  padding: '8px 10px',
  border: '1px solid var(--border)',
  borderRadius: 8,
  fontSize: '0.85rem',
  fontFamily: 'inherit',
  background: '#fff',
  color: 'var(--text)',
} as const

export default function ExpensesPage() {
  const { user } = useAuth()
  const [expenses, setExpenses] = useState<Expense[] | null>(null)
  const [error, setError] = useState('')

  // Filters (client-side — the whole list is small for a couple).
  const [q, setQ] = useState('')
  const [fStatus, setFStatus] = useState('')
  const [fCycle, setFCycle] = useState('')
  const [fOwner, setFOwner] = useState('')
  const [fCat, setFCat] = useState('')

  async function load() {
    try {
      setExpenses(await api.get('/expenses'))
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    load()
  }, [])

  async function changeStatus(id: string, status: string) {
    await api.patch(`/expenses/${id}/status`, { status })
    load()
  }
  async function remove(id: string, name: string) {
    if (!window.confirm(`ลบ "${name}" ถาวร? (กู้คืนไม่ได้)`)) return
    await api.del(`/expenses/${id}`)
    load()
  }

  // Categories present in the list, for the category filter.
  const categories = useMemo(() => {
    const map = new Map<string, string>()
    for (const e of expenses ?? []) if (e.category) map.set(e.categoryId, e.category.name)
    return [...map.entries()]
      .map(([id, name]) => ({ id, name }))
      .sort((a, b) => a.name.localeCompare(b.name, 'th'))
  }, [expenses])

  const filtered = useMemo(() => {
    const query = q.trim().toLowerCase()
    return (expenses ?? []).filter((e) => {
      if (query && !e.name.toLowerCase().includes(query)) return false
      if (fStatus && e.status !== fStatus) return false
      if (fCycle && e.billingCycle !== fCycle) return false
      if (fCat && e.categoryId !== fCat) return false
      if (fOwner === 'shared' && e.ownerType !== 'SHARED') return false
      if (fOwner === 'me' && !(e.ownerType === 'PERSONAL' && e.ownerUserId === user?.id)) return false
      if (fOwner === 'partner' && !(e.ownerType === 'PERSONAL' && e.ownerUserId !== user?.id)) return false
      return true
    })
  }, [expenses, q, fStatus, fCycle, fCat, fOwner, user?.id])

  return (
    <AppShell>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16 }}>
        <h2 style={{ margin: 0 }}>รายการค่าใช้จ่าย</h2>
        <Link to="/expenses/new" className="btn" style={{ width: 'auto', padding: '9px 16px', textDecoration: 'none' }}>
          + เพิ่มรายการ
        </Link>
      </div>

      {expenses === null ? (
        error ? <ErrorState message={error} onRetry={load} /> : <LoadingCards />
      ) : expenses.length === 0 ? (
        <EmptyState
          icon="🌱"
          title="ยังไม่มีรายการ"
          hint="เพิ่มค่าใช้จ่ายที่จ่ายประจำ เช่น ค่าเช่า ค่าเน็ต หรือ subscription แล้วระบบจะช่วยจำให้"
          action={
            <Link to="/expenses/new" className="btn" style={{ width: 'auto', padding: '10px 20px', textDecoration: 'none' }}>
              + เพิ่มรายการ
            </Link>
          }
        />
      ) : (
        <>
          {error && <div className="error">{error}</div>}
          {/* Search + filters */}
          <div className="card" style={{ padding: 14, marginBottom: 12, display: 'flex', flexDirection: 'column', gap: 10 }}>
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder="🔍 ค้นหาชื่อรายการ…"
              style={{
                padding: '10px 13px',
                border: '1px solid var(--border)',
                borderRadius: 10,
                fontSize: '0.95rem',
                fontFamily: 'inherit',
              }}
            />
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              <select value={fStatus} onChange={(e) => setFStatus(e.target.value)} style={selStyle}>
                <option value="">ทุกสถานะ</option>
                <option value="ACTIVE">ใช้อยู่</option>
                <option value="PAUSED">พักไว้</option>
                <option value="CANCELLED">เลิกแล้ว</option>
              </select>
              <select value={fCycle} onChange={(e) => setFCycle(e.target.value)} style={selStyle}>
                <option value="">ทุกแบบ</option>
                <option value="MONTHLY">รายเดือน</option>
                <option value="YEARLY">รายปี</option>
              </select>
              <select value={fOwner} onChange={(e) => setFOwner(e.target.value)} style={selStyle}>
                <option value="">ทุกเจ้าของ</option>
                <option value="me">ของฉัน</option>
                <option value="partner">ของแฟน</option>
                <option value="shared">ของเรา</option>
              </select>
              <select value={fCat} onChange={(e) => setFCat(e.target.value)} style={selStyle}>
                <option value="">ทุกหมวด</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>{c.name}</option>
                ))}
              </select>
            </div>
          </div>

          <div className="muted" style={{ fontSize: '0.82rem', marginBottom: 10 }}>
            แสดง {filtered.length} จาก {expenses.length} รายการ
          </div>

          {filtered.length === 0 ? (
            <div className="card" style={{ textAlign: 'center', color: 'var(--text-soft)' }}>
              ไม่พบรายการที่ตรงกับตัวกรอง
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {filtered.map((e) => {
                const st = STATUS_LABELS[e.status]
                return (
                  <div key={e.id} className="card" style={{ padding: 16, opacity: e.status === 'CANCELLED' ? 0.6 : 1 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 10 }}>
                      <div>
                        <Link
                          to={`/expenses/${e.id}`}
                          style={{ color: 'var(--text)', textDecoration: 'none', fontWeight: 600, fontSize: '1.05rem' }}
                        >
                          {e.name} <span className="muted" style={{ fontWeight: 400 }}>›</span>
                        </Link>
                        <div className="muted" style={{ fontSize: '0.85rem', marginTop: 2 }}>
                          {e.category?.name} · {CYCLE_LABELS[e.billingCycle]}
                        </div>
                        <div style={{ display: 'flex', gap: 6, marginTop: 8, flexWrap: 'wrap' }}>
                          <OwnerChip e={e} myId={user?.id} />
                          <PayerChip e={e} myId={user?.id} />
                        </div>
                      </div>
                      <div style={{ textAlign: 'right', whiteSpace: 'nowrap' }}>
                        <div style={{ fontWeight: 700 }}>{formatTHB(e.amount)}</div>
                        <span style={{ fontSize: '0.72rem', color: st.color, background: st.bg, padding: '2px 8px', borderRadius: 20 }}>
                          {st.label}
                        </span>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 8, marginTop: 12, flexWrap: 'wrap' }}>
                      <Link to={`/expenses/${e.id}`} className="link-action">รายละเอียด</Link>
                      <Link to={`/expenses/${e.id}/edit`} className="link-action">แก้ไข</Link>
                      {e.status === 'ACTIVE' && (
                        <button className="link-action" onClick={() => changeStatus(e.id, 'PAUSED')}>พัก</button>
                      )}
                      {e.status === 'PAUSED' && (
                        <button className="link-action" onClick={() => changeStatus(e.id, 'ACTIVE')}>ใช้ต่อ</button>
                      )}
                      {e.status !== 'CANCELLED' ? (
                        <button className="link-action" onClick={() => changeStatus(e.id, 'CANCELLED')}>เลิก</button>
                      ) : (
                        <button className="link-action" onClick={() => changeStatus(e.id, 'ACTIVE')}>เปิดใหม่</button>
                      )}
                      <button className="link-action danger" onClick={() => remove(e.id, e.name)}>ลบ</button>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}
    </AppShell>
  )
}

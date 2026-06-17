import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from '../auth'
import { api } from '../api'
import type { Workspace, Dashboard, DueLite } from '../types'
import { formatTHB, formatThaiDate } from '../helpers'
import { LoadingCards, ErrorState } from '../states'
import AppShell from './AppShell'

function Stat({ label, value, sub }: { label: string; value: string; sub?: string }) {
  return (
    <div className="card" style={{ padding: 16 }}>
      <div className="muted" style={{ fontSize: '0.8rem' }}>{label}</div>
      <div style={{ fontSize: '1.35rem', fontWeight: 700, marginTop: 4 }}>{value}</div>
      {sub && <div className="muted" style={{ fontSize: '0.78rem', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}

function DueRow({ d, color, tag }: { d: DueLite; color: string; tag: string }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.9rem' }}>
      <span>
        <span style={{ color, fontSize: '0.72rem', fontWeight: 600, marginRight: 6 }}>{tag}</span>
        {d.name} <span className="muted">(วันที่ {d.day})</span>
      </span>
      <span style={{ fontWeight: 600 }}>{formatTHB(d.amount)}</span>
    </div>
  )
}

export default function HomePage() {
  const { user } = useAuth()
  const [ws, setWs] = useState<Workspace | null>(null)
  const [dash, setDash] = useState<Dashboard | null>(null)
  const [error, setError] = useState('')

  function loadDash() {
    setError('')
    api.get('/dashboard').then(setDash).catch((e) => setError((e as Error).message))
  }
  useEffect(() => {
    api.get('/workspace').then(setWs).catch(() => {})
    loadDash()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  return (
    <AppShell>
      <h2 style={{ marginTop: 0 }}>สวัสดี {user?.displayName} 👋</h2>
      {error && !dash && <ErrorState message={error} onRetry={loadDash} />}

      {!dash && !error && <LoadingCards count={3} />}

      {dash && (
        <>
          {/* Top stats */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))',
              gap: 12,
              marginBottom: 16,
            }}
          >
            <Stat label="เฉลี่ยต่อเดือน" value={formatTHB(dash.monthlyAverage)} />
            <Stat label="ประเมินทั้งปี" value={formatTHB(dash.yearlyEstimate)} />
            <Stat label="รายการที่ใช้อยู่" value={String(dash.activeCount)} sub="รายการ" />
          </div>

          {/* This month */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 8 }}>
              <div style={{ fontWeight: 700 }}>เดือนนี้</div>
              <Link to="/monthly" className="link-action">ดูรายเดือน →</Link>
            </div>
            <div className="muted" style={{ fontSize: '0.9rem', marginBottom: 12 }}>
              จ่ายแล้ว {dash.thisMonth.paidCount}/{dash.thisMonth.dueCount} รายการ · ยอดรวม {formatTHB(dash.thisMonth.total)}
            </div>
            {dash.thisMonth.overdue.length === 0 && dash.thisMonth.upcoming.length === 0 ? (
              <div className="muted" style={{ fontSize: '0.85rem' }}>ไม่มีรายการค้างจ่าย 🎉</div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {dash.thisMonth.overdue.map((d) => (
                  <DueRow key={d.expenseId} d={d} color="#c62828" tag="เลยกำหนด" />
                ))}
                {dash.thisMonth.upcoming.map((d) => (
                  <DueRow key={d.expenseId} d={d} color="#9a6a00" tag="ใกล้ถึง" />
                ))}
              </div>
            )}
          </div>

          {/* Who pays */}
          <div className="card" style={{ marginBottom: 16 }}>
            <div style={{ fontWeight: 700, marginBottom: 12 }}>ใครจ่ายเท่าไหร่ (เฉลี่ย/เดือน)</div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {dash.perMember.map((m) => {
                const isMe = m.userId === user?.id
                return (
                  <div key={m.userId} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <span style={{ display: 'inline-flex', alignItems: 'center', gap: 8 }}>
                      <span style={{ width: 9, height: 9, borderRadius: '50%', background: isMe ? 'var(--mine)' : 'var(--partner)' }} />
                      {m.displayName}
                      {isMe ? <span className="muted"> (ฉัน)</span> : ''}
                    </span>
                    <span style={{ fontWeight: 600 }}>{formatTHB(m.monthly)}</span>
                  </div>
                )
              })}
            </div>
            <div
              className="muted"
              style={{ fontSize: '0.82rem', marginTop: 12, paddingTop: 12, borderTop: '1px solid var(--border)' }}
            >
              ของเรา {formatTHB(dash.sharedMonthly)} · ส่วนตัว {formatTHB(dash.personalMonthly)}
            </div>
          </div>

          {/* Next due */}
          {dash.nextDue && (
            <div className="card" style={{ marginBottom: 16 }}>
              <div className="muted" style={{ fontSize: '0.8rem' }}>ครบกำหนดถัดไป</div>
              <div style={{ marginTop: 4 }}>
                <span style={{ fontWeight: 600 }}>{dash.nextDue.name}</span> — {formatTHB(dash.nextDue.amount)}
              </div>
              <div className="muted" style={{ fontSize: '0.85rem', marginTop: 2 }}>
                {formatThaiDate(dash.nextDue.year, dash.nextDue.month, dash.nextDue.day)}
              </div>
            </div>
          )}
        </>
      )}

      {/* Workspace / invite code */}
      {ws && (
        <div className="card">
          <div className="muted" style={{ fontSize: '0.85rem' }}>พื้นที่ของเรา</div>
          <div style={{ fontSize: '1.1rem', fontWeight: 600, marginBottom: 8 }}>{ws.name}</div>
          <div style={{ marginBottom: 8 }}>
            <span className="muted" style={{ fontSize: '0.85rem' }}>invite code: </span>
            <span
              style={{
                fontFamily: 'ui-monospace, Consolas, monospace',
                background: 'var(--accent-soft)',
                color: 'var(--accent-dark)',
                padding: '3px 10px',
                borderRadius: 6,
                fontWeight: 600,
              }}
            >
              {ws.inviteCode}
            </span>
          </div>
          <div className="muted" style={{ fontSize: '0.85rem' }}>
            สมาชิก: {ws.members.map((m) => m.displayName).join(', ')}
          </div>
        </div>
      )}
    </AppShell>
  )
}

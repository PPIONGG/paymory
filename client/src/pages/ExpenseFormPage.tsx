import { useEffect, useState, type FormEvent } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useAuth } from '../auth'
import { api } from '../api'
import type { Category, Expense, Member } from '../types'
import { PAYMENT_METHODS } from '../helpers'
import { LoadingCards } from '../states'
import AppShell from './AppShell'

const MONTHS = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.']

function Segmented({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (v: string) => void
  options: { v: string; l: string }[]
}) {
  return (
    <div style={{ display: 'flex', gap: 6 }}>
      {options.map((o) => (
        <button
          key={o.v}
          type="button"
          onClick={() => onChange(o.v)}
          className={value === o.v ? 'btn' : 'btn btn-ghost'}
          style={{ flex: 1, padding: '9px', fontSize: '0.9rem' }}
        >
          {o.l}
        </button>
      ))}
    </div>
  )
}

export default function ExpenseFormPage() {
  const { id } = useParams()
  const editing = Boolean(id)
  const navigate = useNavigate()
  const { user } = useAuth()

  const [categories, setCategories] = useState<Category[]>([])
  const [partner, setPartner] = useState<Member | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  const [name, setName] = useState('')
  const [amount, setAmount] = useState('')
  const [categoryId, setCategoryId] = useState('')
  const [billingCycle, setBillingCycle] = useState<'MONTHLY' | 'YEARLY'>('MONTHLY')
  const [dueDay, setDueDay] = useState('1')
  const [dueMonth, setDueMonth] = useState('1')
  const [ownerChoice, setOwnerChoice] = useState<'me' | 'partner' | 'shared'>('me')
  const [payerChoice, setPayerChoice] = useState<'me' | 'partner' | 'split'>('me')
  const [splitPercent, setSplitPercent] = useState(50)
  const [paymentMethod, setPaymentMethod] = useState('OTHER')
  const [status, setStatus] = useState<'ACTIVE' | 'PAUSED' | 'CANCELLED'>('ACTIVE')
  const [notes, setNotes] = useState('')
  const [link, setLink] = useState('')

  useEffect(() => {
    async function init() {
      try {
        const ws = await api.get('/workspace')
        setCategories(ws.categories || [])
        setPartner((ws.members || []).find((m: Member) => m.id !== user?.id) || null)
        if (!editing && ws.categories?.length) setCategoryId(ws.categories[0].id)
        if (editing) {
          const e: Expense = await api.get(`/expenses/${id}`)
          setName(e.name)
          setAmount(String(Number(e.amount)))
          setCategoryId(e.categoryId)
          setBillingCycle(e.billingCycle)
          setDueDay(String(e.dueDay))
          setDueMonth(String(e.dueMonth ?? 1))
          setOwnerChoice(e.ownerType === 'SHARED' ? 'shared' : e.ownerUserId === user?.id ? 'me' : 'partner')
          setPayerChoice(e.payerType === 'SPLIT' ? 'split' : e.payerUserId === user?.id ? 'me' : 'partner')
          setSplitPercent(e.splitPercent ?? 50)
          setPaymentMethod(e.paymentMethod)
          setStatus(e.status)
          setNotes(e.notes ?? '')
          setLink(e.link ?? '')
        }
      } catch (e) {
        setError((e as Error).message)
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [id])

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const myId = user!.id
      const payload = {
        name,
        amount: Number(amount),
        categoryId,
        billingCycle,
        dueDay: Number(dueDay),
        dueMonth: billingCycle === 'YEARLY' ? Number(dueMonth) : null,
        ownerType: ownerChoice === 'shared' ? 'SHARED' : 'PERSONAL',
        ownerUserId: ownerChoice === 'me' ? myId : ownerChoice === 'partner' ? partner?.id ?? null : null,
        payerType: payerChoice === 'split' ? 'SPLIT' : 'PERSONAL',
        payerUserId: payerChoice === 'me' ? myId : payerChoice === 'partner' ? partner?.id ?? null : null,
        splitPercent: payerChoice === 'split' ? splitPercent : null,
        paymentMethod,
        status,
        notes: notes || null,
        link: link || null,
      }
      if (editing) await api.patch(`/expenses/${id}`, payload)
      else await api.post('/expenses', payload)
      navigate('/expenses')
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  if (loading)
    return (
      <AppShell>
        <LoadingCards count={1} />
      </AppShell>
    )

  const hasPartner = Boolean(partner)
  const ownerOptions = [
    { v: 'me', l: 'ของฉัน' },
    ...(hasPartner ? [{ v: 'partner', l: 'ของแฟน' }] : []),
    { v: 'shared', l: 'ของเรา' },
  ]
  const payerOptions = [
    { v: 'me', l: 'ฉันจ่าย' },
    ...(hasPartner ? [{ v: 'partner', l: 'แฟนจ่าย' }, { v: 'split', l: 'หารกัน' }] : []),
  ]

  return (
    <AppShell>
      <button
        onClick={() => navigate('/expenses')}
        className="muted"
        style={{ background: 'none', border: 'none', cursor: 'pointer', marginBottom: 12, fontSize: '0.9rem' }}
      >
        ← กลับ
      </button>
      <h2 style={{ marginTop: 0 }}>{editing ? 'แก้ไขรายการ' : 'เพิ่มรายการใหม่'}</h2>

      <form onSubmit={submit} className="card">
        <div className="field">
          <label>ชื่อรายการ</label>
          <input value={name} onChange={(e) => setName(e.target.value)} required placeholder="เช่น Netflix, ค่าเน็ต" />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          <div className="field" style={{ flex: 1 }}>
            <label>จำนวนเงิน (บาท)</label>
            <input type="number" min="0" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} required />
          </div>
          <div className="field" style={{ flex: 1 }}>
            <label>หมวดหมู่</label>
            <select value={categoryId} onChange={(e) => setCategoryId(e.target.value)} required>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>
          </div>
        </div>

        <div className="field">
          <label>รอบบิล</label>
          <Segmented
            value={billingCycle}
            onChange={(v) => setBillingCycle(v as 'MONTHLY' | 'YEARLY')}
            options={[
              { v: 'MONTHLY', l: 'รายเดือน' },
              { v: 'YEARLY', l: 'รายปี' },
            ]}
          />
        </div>

        <div style={{ display: 'flex', gap: 12 }}>
          {billingCycle === 'YEARLY' && (
            <div className="field" style={{ flex: 1 }}>
              <label>เดือนที่จ่าย</label>
              <select value={dueMonth} onChange={(e) => setDueMonth(e.target.value)}>
                {MONTHS.map((m, i) => (
                  <option key={i} value={i + 1}>
                    {m}
                  </option>
                ))}
              </select>
            </div>
          )}
          <div className="field" style={{ flex: 1 }}>
            <label>วันครบกำหนด (วันที่)</label>
            <input type="number" min="1" max="31" value={dueDay} onChange={(e) => setDueDay(e.target.value)} required />
          </div>
        </div>

        <div className="field">
          <label>ของใคร (เจ้าของ)</label>
          <Segmented value={ownerChoice} onChange={(v) => setOwnerChoice(v as 'me' | 'partner' | 'shared')} options={ownerOptions} />
        </div>

        <div className="field">
          <label>ใครจ่าย</label>
          <Segmented value={payerChoice} onChange={(v) => setPayerChoice(v as 'me' | 'partner' | 'split')} options={payerOptions} />
        </div>

        {payerChoice === 'split' && (
          <div className="field">
            <label>
              สัดส่วนหาร — ฉัน {splitPercent}% / แฟน {100 - splitPercent}%
            </label>
            <input type="range" min="1" max="99" value={splitPercent} onChange={(e) => setSplitPercent(Number(e.target.value))} />
          </div>
        )}

        <div className="field">
          <label>ช่องทางจ่าย</label>
          <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)}>
            {Object.entries(PAYMENT_METHODS).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {editing && (
          <div className="field">
            <label>สถานะ</label>
            <select value={status} onChange={(e) => setStatus(e.target.value as 'ACTIVE' | 'PAUSED' | 'CANCELLED')}>
              <option value="ACTIVE">ใช้อยู่</option>
              <option value="PAUSED">พักไว้</option>
              <option value="CANCELLED">เลิกแล้ว</option>
            </select>
          </div>
        )}

        <div className="field">
          <label>โน้ต (ไม่บังคับ)</label>
          <textarea value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
        </div>
        <div className="field">
          <label>ลิงก์ (ไม่บังคับ)</label>
          <input value={link} onChange={(e) => setLink(e.target.value)} placeholder="https://..." />
        </div>

        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy}>
          {busy ? 'กำลังบันทึก…' : editing ? 'บันทึกการแก้ไข' : 'เพิ่มรายการ'}
        </button>
      </form>
    </AppShell>
  )
}

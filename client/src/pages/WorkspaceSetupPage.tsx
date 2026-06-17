import { useState, type FormEvent } from 'react'
import { useAuth } from '../auth'
import { api } from '../api'
import AuthLayout from './AuthLayout'

export default function WorkspaceSetupPage() {
  const { user, refresh, logout } = useAuth()
  const [tab, setTab] = useState<'create' | 'join'>('create')
  const [name, setName] = useState('')
  const [inviteCode, setInviteCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function create(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/workspace/create', { name })
      await refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function join(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await api.post('/workspace/join', { inviteCode })
      await refresh()
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="ตั้งค่าพื้นที่ของคุณ" subtitle={`สวัสดี ${user?.displayName} 👋`}>
      <div style={{ display: 'flex', gap: 8, marginBottom: 16 }}>
        <button
          type="button"
          className={tab === 'create' ? 'btn' : 'btn btn-ghost'}
          style={{ flex: 1 }}
          onClick={() => setTab('create')}
        >
          สร้างใหม่
        </button>
        <button
          type="button"
          className={tab === 'join' ? 'btn' : 'btn btn-ghost'}
          style={{ flex: 1 }}
          onClick={() => setTab('join')}
        >
          เข้าร่วม
        </button>
      </div>

      {tab === 'create' ? (
        <form onSubmit={create}>
          <div className="field">
            <label>ตั้งชื่อพื้นที่ (เช่น "บ้านเรา")</label>
            <input value={name} onChange={(e) => setName(e.target.value)} required />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn" disabled={busy}>
            {busy ? 'กำลังสร้าง…' : 'สร้างพื้นที่'}
          </button>
        </form>
      ) : (
        <form onSubmit={join}>
          <div className="field">
            <label>ใส่ invite code จากคู่ของคุณ</label>
            <input value={inviteCode} onChange={(e) => setInviteCode(e.target.value)} required />
          </div>
          {error && <div className="error">{error}</div>}
          <button className="btn" disabled={busy}>
            {busy ? 'กำลังเข้าร่วม…' : 'เข้าร่วม'}
          </button>
        </form>
      )}

      <p className="muted" style={{ marginTop: 16, textAlign: 'center', fontSize: '0.85rem' }}>
        <button
          type="button"
          onClick={logout}
          style={{ background: 'none', border: 'none', color: 'var(--text-soft)', cursor: 'pointer', textDecoration: 'underline' }}
        >
          ออกจากระบบ
        </button>
      </p>
    </AuthLayout>
  )
}

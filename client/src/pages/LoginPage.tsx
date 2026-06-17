import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import AuthLayout from './AuthLayout'

export default function LoginPage() {
  const { login } = useAuth()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="เข้าสู่ระบบ" subtitle="ยินดีต้อนรับกลับมา 💛">
      <form onSubmit={submit}>
        <div className="field">
          <label>อีเมล</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>รหัสผ่าน</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy}>
          {busy ? 'กำลังเข้า…' : 'เข้าสู่ระบบ'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16, textAlign: 'center', fontSize: '0.9rem' }}>
        ยังไม่มีบัญชี? <Link to="/signup">สมัครสมาชิก</Link>
      </p>
    </AuthLayout>
  )
}

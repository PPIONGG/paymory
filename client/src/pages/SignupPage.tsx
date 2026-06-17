import { useState, type FormEvent } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { useAuth } from '../auth'
import AuthLayout from './AuthLayout'

export default function SignupPage() {
  const { register } = useAuth()
  const navigate = useNavigate()
  const [displayName, setDisplayName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [signupCode, setSignupCode] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      await register({ displayName, email, password, signupCode })
      navigate('/')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout title="สมัครสมาชิก" subtitle="เริ่มต้นใช้งาน Paymory">
      <form onSubmit={submit}>
        <div className="field">
          <label>ชื่อที่แสดง</label>
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)} required />
        </div>
        <div className="field">
          <label>อีเมล</label>
          <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} required />
        </div>
        <div className="field">
          <label>รหัสผ่าน (อย่างน้อย 6 ตัว)</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
          />
        </div>
        <div className="field">
          <label>รหัสสมัคร (sign-up code)</label>
          <input value={signupCode} onChange={(e) => setSignupCode(e.target.value)} required />
        </div>
        {error && <div className="error">{error}</div>}
        <button className="btn" disabled={busy}>
          {busy ? 'กำลังสมัคร…' : 'สมัครสมาชิก'}
        </button>
      </form>
      <p className="muted" style={{ marginTop: 16, textAlign: 'center', fontSize: '0.9rem' }}>
        มีบัญชีแล้ว? <Link to="/login">เข้าสู่ระบบ</Link>
      </p>
    </AuthLayout>
  )
}

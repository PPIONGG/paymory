import { useEffect, useState, type FormEvent } from 'react'
import { api } from '../api'
import type { CategoryWithCount } from '../types'
import { LoadingCards, EmptyState, ErrorState } from '../states'
import AppShell from './AppShell'

const inputStyle = {
  padding: '11px 13px',
  border: '1px solid var(--border)',
  borderRadius: 10,
  fontSize: '1rem',
  fontFamily: 'inherit',
  background: '#fff',
  color: 'var(--text)',
} as const

export default function CategoriesPage() {
  const [cats, setCats] = useState<CategoryWithCount[] | null>(null)
  const [error, setError] = useState('')
  const [newName, setNewName] = useState('')
  const [busy, setBusy] = useState(false)
  const [editId, setEditId] = useState<string | null>(null)
  const [editName, setEditName] = useState('')

  async function load() {
    try {
      setCats(await api.get('/categories'))
    } catch (e) {
      setError((e as Error).message)
    }
  }
  useEffect(() => {
    load()
  }, [])

  async function add(ev: FormEvent) {
    ev.preventDefault()
    if (!newName.trim()) return
    setError('')
    setBusy(true)
    try {
      await api.post('/categories', { name: newName.trim() })
      setNewName('')
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  function startEdit(c: CategoryWithCount) {
    setEditId(c.id)
    setEditName(c.name)
    setError('')
  }
  async function saveEdit(id: string) {
    if (!editName.trim()) return
    setBusy(true)
    setError('')
    try {
      await api.patch(`/categories/${id}`, { name: editName.trim() })
      setEditId(null)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }
  async function remove(c: CategoryWithCount) {
    if (!window.confirm(`ลบหมวด "${c.name}"?`)) return
    setError('')
    setBusy(true)
    try {
      await api.del(`/categories/${c.id}`)
      await load()
    } catch (e) {
      setError((e as Error).message)
    } finally {
      setBusy(false)
    }
  }

  return (
    <AppShell>
      <h2 style={{ marginTop: 0, marginBottom: 4 }}>หมวดหมู่</h2>
      <p className="muted" style={{ fontSize: '0.9rem', marginTop: 0, marginBottom: 16 }}>
        จัดกลุ่มค่าใช้จ่าย — เพิ่ม แก้ชื่อ หรือลบหมวดที่ไม่ได้ใช้
      </p>

      {/* Add new */}
      <form onSubmit={add} className="card" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, padding: 14 }}>
        <input
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          placeholder="ชื่อหมวดใหม่ เช่น ประกัน, ค่าเล่าเรียน"
          maxLength={40}
          style={{ ...inputStyle, flex: 1, minWidth: 0 }}
        />
        <button className="btn" style={{ width: 'auto', padding: '11px 18px' }} disabled={busy || !newName.trim()}>
          เพิ่ม
        </button>
      </form>

      {error && cats !== null && <div className="error">{error}</div>}

      {cats === null ? (
        error ? <ErrorState message={error} onRetry={load} /> : <LoadingCards count={4} />
      ) : cats.length === 0 ? (
        <EmptyState icon="🏷️" title="ยังไม่มีหมวดหมู่" hint="เพิ่มหมวดแรกได้จากช่องด้านบน" />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {cats.map((c) => (
            <div key={c.id} className="card" style={{ padding: 14, display: 'flex', alignItems: 'center', gap: 10 }}>
              {editId === c.id ? (
                <>
                  <input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    maxLength={40}
                    autoFocus
                    style={{ ...inputStyle, flex: 1, minWidth: 0, padding: '8px 11px', fontSize: '0.95rem' }}
                  />
                  <button className="link-action" disabled={busy || !editName.trim()} onClick={() => saveEdit(c.id)}>
                    บันทึก
                  </button>
                  <button className="link-action" onClick={() => setEditId(null)}>ยกเลิก</button>
                </>
              ) : (
                <>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <span style={{ fontWeight: 600 }}>{c.name}</span>
                    <span className="muted" style={{ fontSize: '0.82rem', marginLeft: 8 }}>
                      {c.expenseCount > 0 ? `ใช้อยู่ ${c.expenseCount} รายการ` : 'ยังไม่มีรายการ'}
                    </span>
                  </div>
                  <button className="link-action" onClick={() => startEdit(c)}>แก้ชื่อ</button>
                  <button
                    className="link-action danger"
                    disabled={busy || c.expenseCount > 0}
                    title={c.expenseCount > 0 ? 'ลบไม่ได้ — มีรายการใช้หมวดนี้อยู่' : 'ลบหมวดนี้'}
                    style={{ opacity: c.expenseCount > 0 ? 0.4 : 1 }}
                    onClick={() => remove(c)}
                  >
                    ลบ
                  </button>
                </>
              )}
            </div>
          ))}
        </div>
      )}
    </AppShell>
  )
}

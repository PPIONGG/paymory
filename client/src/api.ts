const BASE = import.meta.env.VITE_API_BASE || '/api'

async function request(path: string, options: RequestInit = {}) {
  const res = await fetch(BASE + path, {
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    ...options,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error((data && data.error) || 'เกิดข้อผิดพลาด')
  }
  return data
}

export const api = {
  get: (path: string) => request(path),
  post: (path: string, body?: unknown) =>
    request(path, { method: 'POST', body: body ? JSON.stringify(body) : undefined }),
  patch: (path: string, body?: unknown) =>
    request(path, { method: 'PATCH', body: body ? JSON.stringify(body) : undefined }),
  del: (path: string) => request(path, { method: 'DELETE' }),
}

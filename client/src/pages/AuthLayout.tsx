import type { ReactNode } from 'react'

export default function AuthLayout({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: ReactNode
}) {
  return (
    <main style={{ minHeight: '100vh', display: 'grid', placeItems: 'center', padding: '1rem' }}>
      <div className="card" style={{ width: '100%', maxWidth: 380 }}>
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <div style={{ fontSize: '1.6rem', fontWeight: 700 }}>Paymory</div>
          {subtitle && (
            <div className="muted" style={{ fontSize: '0.9rem', marginTop: 2 }}>
              {subtitle}
            </div>
          )}
        </div>
        <h2 style={{ fontSize: '1.05rem', fontWeight: 600, margin: '0 0 16px' }}>{title}</h2>
        {children}
      </div>
    </main>
  )
}

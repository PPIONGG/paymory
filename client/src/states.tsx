import type { CSSProperties, ReactNode } from 'react'

// Shared loading / empty / error states so every page speaks the same language.
// Emptiness and failure are moments for direction, not mood — each says what to do next.

export function Skeleton({
  w = '100%',
  h = 14,
  r = 7,
  style,
}: {
  w?: number | string
  h?: number | string
  r?: number
  style?: CSSProperties
}) {
  return <div className="skeleton" style={{ width: w, height: h, borderRadius: r, ...style }} />
}

// A few card-shaped placeholders that echo a list while it loads.
export function LoadingCards({ count = 3 }: { count?: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }} aria-busy="true" aria-label="กำลังโหลด">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="card" style={{ padding: 16, display: 'flex', justifyContent: 'space-between', gap: 12 }}>
          <div style={{ flex: 1 }}>
            <Skeleton w="55%" h={16} />
            <Skeleton w="80%" h={11} style={{ marginTop: 10 }} />
            <Skeleton w={120} h={20} r={20} style={{ marginTop: 12 }} />
          </div>
          <Skeleton w={64} h={18} />
        </div>
      ))}
    </div>
  )
}

export function EmptyState({
  icon,
  title,
  hint,
  action,
}: {
  icon?: string
  title: string
  hint?: string
  action?: ReactNode
}) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '36px 20px' }}>
      {icon && <div style={{ fontSize: '2rem', marginBottom: 10 }}>{icon}</div>}
      <div style={{ fontWeight: 600, fontSize: '1.02rem' }}>{title}</div>
      {hint && (
        <div className="muted" style={{ fontSize: '0.88rem', marginTop: 6, maxWidth: 320, marginInline: 'auto' }}>{hint}</div>
      )}
      {action && <div style={{ marginTop: 16 }}>{action}</div>}
    </div>
  )
}

export function ErrorState({ message, onRetry }: { message: string; onRetry?: () => void }) {
  return (
    <div className="card" style={{ textAlign: 'center', padding: '32px 20px' }}>
      <div style={{ fontSize: '1.6rem', marginBottom: 8 }}>😕</div>
      <div style={{ fontWeight: 600 }}>โหลดข้อมูลไม่สำเร็จ</div>
      <div className="muted" style={{ fontSize: '0.88rem', marginTop: 6 }}>{message}</div>
      {onRetry && (
        <button className="btn btn-ghost" style={{ width: 'auto', padding: '8px 18px', marginTop: 16 }} onClick={onRetry}>
          ลองใหม่
        </button>
      )}
    </div>
  )
}

import type { ReactNode } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'

// Minimal line icons — inherit colour from the link via currentColor.
const ic = {
  width: 22,
  height: 22,
  viewBox: '0 0 24 24',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.7,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
}

function HomeIcon() {
  return (
    <svg {...ic}>
      <path d="M3 10.8 12 3.5l9 7.3" />
      <path d="M5.5 9.3V20h13V9.3" />
    </svg>
  )
}
function CalendarIcon() {
  return (
    <svg {...ic}>
      <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
      <path d="M3.5 9.5h17M8 3.5v3M16 3.5v3" />
    </svg>
  )
}
function ListIcon() {
  return (
    <svg {...ic}>
      <path d="M8 6.5h12M8 12h12M8 17.5h12" />
      <circle cx="4" cy="6.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="4" cy="17.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}
function TagIcon() {
  return (
    <svg {...ic}>
      <path d="M4 4.5h7.2L20 13.3a2 2 0 0 1 0 2.8l-3.9 3.9a2 2 0 0 1-2.8 0L4.5 11.2z" />
      <circle cx="8.6" cy="8.6" r="1.4" />
    </svg>
  )
}

const TABS = [
  { to: '/', label: 'หน้าหลัก', Icon: HomeIcon },
  { to: '/monthly', label: 'รายเดือน', Icon: CalendarIcon },
  { to: '/expenses', label: 'รายการ', Icon: ListIcon },
  { to: '/categories', label: 'หมวดหมู่', Icon: TagIcon },
]

// Highlight a tab on its own page and its sub-pages (e.g. /expenses/:id keeps "รายการ" lit).
function isActive(pathname: string, to: string) {
  return to === '/' ? pathname === '/' : pathname === to || pathname.startsWith(to + '/')
}

export default function AppShell({ children }: { children: ReactNode }) {
  const { logout } = useAuth()
  const { pathname } = useLocation()

  return (
    <div>
      <header className="appbar">
        <div className="appbar-inner">
          <Link to="/" className="appbar-brand">Paymory</Link>
          <nav className="appbar-nav">
            {TABS.map((t) => (
              <Link key={t.to} to={t.to} className={isActive(pathname, t.to) ? 'nav-link active' : 'nav-link'}>
                {t.label}
              </Link>
            ))}
          </nav>
          <button className="btn btn-ghost appbar-logout" onClick={logout}>ออกจากระบบ</button>
        </div>
      </header>

      <main className="app-main">{children}</main>

      <nav className="bottom-nav" aria-label="เมนูหลัก">
        {TABS.map(({ to, label, Icon }) => (
          <Link key={to} to={to} className={isActive(pathname, to) ? 'active' : ''}>
            <Icon />
            <span>{label}</span>
          </Link>
        ))}
      </nav>
    </div>
  )
}

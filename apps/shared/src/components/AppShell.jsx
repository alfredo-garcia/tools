import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IconMenu } from './Icons.jsx'

/**
 * AppShell: sidebar sticky (md+) + bottom nav (< md).
 * Layout: flex row estándar — sidebar en flujo normal, sticky.
 * navItems = [{ to, label, Icon?, aria }]
 *
 * El toggle (hamburguesa) vive como primer ítem del nav para que los iconos
 * queden perfectamente alineados con los ítems de menú en ambos estados.
 */
function NavLink({ to, label, Icon, aria, isActive, collapsed }) {
  return (
    <Link
      to={to}
      aria-label={aria}
      aria-current={isActive ? 'page' : undefined}
      className={`flex items-center gap-3 rounded-lg min-h-[44px] px-3 py-2.5 text-base font-semibold touch-manipulation transition-colors ${
        isActive
          ? 'bg-primary-muted text-primary'
          : 'text-nav-text hover:bg-surface hover:text-text'
      }`}
    >
      {Icon && <Icon size={22} className="shrink-0" />}
      {!collapsed && <span className="truncate">{label}</span>}
    </Link>
  )
}

export function AppShell({ children, navItems = [], title = '' }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname === to || location.pathname.startsWith(to + '/')
  }

  return (
    <div className="flex min-h-screen bg-background">

      {/* ── Sidebar: solo md+ (CSS fallback en index.css) ── */}
      <aside
        className="app-sidebar hidden md:flex flex-col bg-nav-bg rounded-xl shrink-0 overflow-hidden"
        style={{
          width: sidebarOpen ? '12rem' : '4rem',
          transition: 'width 300ms ease-in-out',
          position: 'sticky',
          top: '1rem',
          height: 'calc(100vh - 2rem)',
          marginTop: '1rem',
          marginLeft: '1rem',
          marginBottom: '1rem',
        }}
      >
        <nav
          className="flex-1 overflow-y-auto overflow-x-hidden py-2 px-2 space-y-1"
          aria-label="Main navigation"
        >
          {/* Hamburguesa + título como primer ítem del nav:
              mismo padding que NavLink → iconos alineados verticalmente */}
          <button
            type="button"
            onClick={() => setSidebarOpen(o => !o)}
            aria-label={sidebarOpen ? 'Collapse menu' : 'Expand menu'}
            className="flex items-center w-full rounded-lg min-h-[44px] px-3 py-2.5 gap-3 text-base font-bold touch-manipulation transition-colors text-nav-text hover:bg-surface hover:text-text cursor-pointer"
          >
            <IconMenu size={22} className="shrink-0" />
            {sidebarOpen && title && (
              <span className="truncate flex-1 text-left">{title}</span>
            )}
          </button>

          {navItems.map(({ to, label, Icon, aria }) => (
            <NavLink
              key={to}
              to={to}
              label={label}
              Icon={Icon}
              aria={aria}
              isActive={isActive(to)}
              collapsed={!sidebarOpen}
            />
          ))}
        </nav>
      </aside>

      {/* ── Contenido principal. Espacio superior: marginTop aquí y pt- en main ── */}
      <div className="flex-1 flex flex-col min-w-0 app-content" style={{ marginTop: '0.5rem' }}>
        <main className="flex-1 w-full min-w-0 pt-2 px-0 md:px-6 pb-28 md:pb-8">
          {children}
        </main>
      </div>

      {/* ── Bottom nav: solo mobile ── */}
      <nav
        className="app-bottom-nav fixed bottom-0 left-0 right-0 z-30 md:hidden"
        aria-label="Main navigation (mobile)"
      >
        <div className="app-bottom-nav-inner flex items-stretch justify-around min-h-[5rem] gap-1 px-4 pt-3 pb-3">
          {navItems.map(({ to, label, Icon, aria }) => (
            <Link
              key={to}
              to={to}
              aria-label={aria}
              aria-current={isActive(to) ? 'page' : undefined}
              className={`app-bottom-nav-link flex flex-col items-center justify-center flex-1 min-w-0 gap-1 py-3 px-2 rounded-xl touch-manipulation transition-colors min-h-[44px] ${
                isActive(to)
                  ? 'bg-primary-muted text-primary'
                  : 'text-nav-text active:bg-surface'
              }`}
            >
              {Icon && <Icon size={26} className="shrink-0" />}
              <span className="text-[8px] font-medium truncate w-full text-center leading-tight">
                {label}
              </span>
            </Link>
          ))}
        </div>
      </nav>

    </div>
  )
}

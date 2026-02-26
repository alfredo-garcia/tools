import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IconChevronsLeft, IconChevronsRight } from './Icons.jsx'

/**
 * Sidebar (lg+) + bottom nav (< lg). navItems = [{ to, label, Icon?, aria }].
 * title opcional para el logo/brand en sidebar.
 */
function NavLink({ to, label, Icon, aria, isActive, collapsed }) {
  return (
    <Link
      to={to}
      aria-label={aria}
      className={`flex items-center gap-3 rounded-xl min-h-[44px] py-2.5 text-base font-bold touch-manipulation transition-colors ${
        isActive
          ? 'bg-primary-muted text-primary'
          : 'text-nav-text hover:bg-surface hover:text-text'
      } ${collapsed ? 'justify-center px-0' : 'pl-5 pr-3'}`}
    >
      {Icon && <Icon size={22} className="shrink-0" />}
      {!collapsed && <span>{label}</span>}
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
    <div className="min-h-screen flex flex-col lg:flex-row bg-background">
      <div
        className="app-shell-sidebar-wrapper hidden lg:block fixed z-20 rounded-xl transition-[width] duration-200"
        style={{
          left: '24px',
          top: '24px',
          width: sidebarOpen ? '12rem' : '4rem',
          height: 'calc(100vh - 48px)',
          paddingLeft: '24px',
          boxSizing: 'content-box',
        }}
      >
        <aside
          className="flex flex-col h-full rounded-xl bg-nav-bg transition-[width] duration-200 shrink-0"
          style={{
            width: sidebarOpen ? '12rem' : '4rem',
            flexDirection: 'column',
            minHeight: 0,
          }}
        >
          {/* Título arriba: My Planner + botón colapsar; colapsado: centrado para alinear con ítems */}
          <div
            className={`flex items-center shrink-0 h-14 rounded-t-xl ${sidebarOpen ? 'justify-between pl-5 pr-3' : 'justify-center'}`}
            style={{ order: 1 }}
          >
            {sidebarOpen && title ? (
              <Link to="/" className="font-bold text-text truncate text-lg">
                {title}
              </Link>
            ) : null}
            <button
              type="button"
              onClick={() => setSidebarOpen((o) => !o)}
              aria-label={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
              className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-nav-text hover:bg-surface hover:text-text transition-colors"
            >
              {sidebarOpen ? <IconChevronsLeft size={20} /> : <IconChevronsRight size={20} />}
            </button>
          </div>
          {/* Ítems del menú debajo del título; colapsado: px-0 para alinear iconos con el de expandir */}
          <nav
            className={`flex-1 py-4 space-y-1 overflow-y-auto min-h-0 ${sidebarOpen ? 'px-5' : 'px-0'}`}
            style={{ order: 2 }}
          >
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
      </div>

      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-200 ${
          sidebarOpen ? 'lg:ml-[calc(12rem+48px)]' : 'lg:ml-[calc(4rem+48px)]'
        }`}
      >
        <main className="flex-1 w-full max-w-4xl mx-auto pt-6 px-6 pb-24 lg:pb-8">
          {children}
        </main>

        <nav
          className="app-shell-bottom-nav fixed bottom-0 left-0 right-0 z-30 bg-nav-bg border-t border-nav-border pb-[env(safe-area-inset-bottom)] lg:hidden"
          aria-label="Navegación principal (móvil)"
        >
          <div className="flex items-stretch justify-around h-16">
            {navItems.map(({ to, label, Icon, aria }) => (
              <Link
                key={to}
                to={to}
                aria-label={aria}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 py-2 text-xs font-bold touch-manipulation transition-colors ${
                  isActive(to)
                    ? 'text-nav-text-active'
                    : 'text-nav-text'
                }`}
              >
                {Icon && <Icon size={22} className="mb-0.5" />}
                <span className="truncate w-full text-center">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}

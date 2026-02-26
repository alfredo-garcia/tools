import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IconChevronLeft, IconChevronRight } from './Icons.jsx'

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
      } ${collapsed ? 'justify-center px-2' : 'pl-4 pr-3'}`}
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
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 z-20 h-full bg-nav-bg border-r border-nav-border transition-[width] duration-200 ${
          sidebarOpen ? 'w-64' : 'w-16'
        }`}
      >
        <div className={`flex items-center h-14 shrink-0 border-b border-nav-border ${sidebarOpen ? 'justify-between pl-5 pr-3' : 'justify-center'}`}>
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
            {sidebarOpen ? <IconChevronLeft size={20} /> : <IconChevronRight size={20} />}
          </button>
        </div>
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
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

      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-200 ${
          sidebarOpen ? 'lg:ml-64' : 'lg:ml-16'
        }`}
      >
        <main className="flex-1 w-full max-w-4xl mx-auto px-5 py-6 pb-24 lg:pb-8">
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

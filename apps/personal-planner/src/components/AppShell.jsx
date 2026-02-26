import { useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { IconHome, IconTarget, IconCheckSquare, IconCircle, IconSettings, IconChevronLeft, IconChevronRight } from './Icons'

const navItems = [
  { to: '/', label: 'Home', Icon: IconHome, aria: 'Dashboard' },
  { to: '/objectives', label: 'OKRs', Icon: IconTarget, aria: 'Objetivos y Key Results' },
  { to: '/tasks', label: 'Tasks', Icon: IconCheckSquare, aria: 'Tareas' },
  { to: '/habits', label: 'Habits', Icon: IconCircle, aria: 'Hábitos' },
  { to: '/settings', label: 'Settings', Icon: IconSettings, aria: 'Ajustes' },
]

function NavLink({ to, label, Icon, aria, isActive, collapsed }) {
  return (
    <Link
      to={to}
      aria-label={aria}
      className={`flex items-center gap-3 rounded-xl min-h-[44px] px-3 py-2.5 text-base font-bold touch-manipulation transition-colors ${
        isActive
          ? 'bg-orange-500/20 text-orange-500 dark:bg-orange-500/20 dark:text-orange-400'
          : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 hover:text-neutral-900 dark:hover:bg-neutral-800 dark:hover:text-white'
      } ${collapsed ? 'justify-center px-2' : ''}`}
    >
      <Icon size={22} className="shrink-0" />
      {!collapsed && <span>{label}</span>}
    </Link>
  )
}

export function AppShell({ children }) {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)

  const isActive = (to) => {
    if (to === '/') return location.pathname === '/'
    return location.pathname === to || location.pathname.startsWith(to + '/')
  }

  return (
    <div className="min-h-screen flex flex-col lg:flex-row bg-white dark:bg-neutral-950">
      {/* Desktop (lg+): sidebar izquierdo colapsable. Tablet horizontal = desktop. */}
      <aside
        className={`hidden lg:flex flex-col fixed left-0 top-0 z-20 h-full bg-neutral-900 dark:bg-neutral-950 border-r border-neutral-800 transition-[width] duration-200 ${
          sidebarOpen ? 'w-52' : 'w-14'
        }`}
      >
        <div className={`flex items-center h-14 shrink-0 border-b border-neutral-800 ${sidebarOpen ? 'justify-between px-3' : 'justify-center'}`}>
          {sidebarOpen ? (
            <Link to="/" className="font-bold text-white truncate text-lg">
              My Planner
            </Link>
          ) : null}
          <button
            type="button"
            onClick={() => setSidebarOpen((o) => !o)}
            aria-label={sidebarOpen ? 'Colapsar menú' : 'Expandir menú'}
            className="min-h-[44px] min-w-[44px] flex items-center justify-center rounded-xl text-neutral-400 hover:bg-neutral-800 hover:text-white transition-colors"
          >
            {sidebarOpen ? <IconChevronLeft size={20} /> : <IconChevronRight size={20} />}
          </button>
        </div>
        <nav className="flex-1 p-2 space-y-1 overflow-y-auto">
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

      {/* Contenido principal */}
      <div
        className={`flex-1 flex flex-col min-h-screen transition-[margin] duration-200 ${
          sidebarOpen ? 'lg:ml-52' : 'lg:ml-14'
        }`}
      >
        <main className="flex-1 w-full max-w-4xl mx-auto px-4 py-4 pb-24 lg:pb-6">
          {children}
        </main>

        {/* Mobile y tablet vertical (< lg): menú inferior fijo */}
        <nav
          className="lg:hidden fixed bottom-0 left-0 right-0 z-30 bg-neutral-900 dark:bg-neutral-950 border-t border-neutral-800 pb-[env(safe-area-inset-bottom)]"
          aria-label="Navegación principal"
        >
          <div className="flex items-stretch justify-around h-16">
            {navItems.map(({ to, label, Icon, aria }) => (
              <Link
                key={to}
                to={to}
                aria-label={aria}
                className={`flex flex-col items-center justify-center flex-1 min-w-0 py-2 text-xs font-bold touch-manipulation transition-colors ${
                  isActive(to)
                    ? 'text-orange-500 dark:text-orange-400'
                    : 'text-neutral-500 dark:text-neutral-400'
                }`}
              >
                <Icon size={22} className="mb-0.5" />
                <span className="truncate w-full text-center">{label}</span>
              </Link>
            ))}
          </div>
        </nav>
      </div>
    </div>
  )
}

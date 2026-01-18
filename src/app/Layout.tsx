import { ReactNode } from 'react'
import { NavLink } from 'react-router-dom'
import { useAuthStore } from '@/services/identity'
import { useShiftStore } from '@/modules/shifts/shiftStore'

interface LayoutProps {
  children: ReactNode
}

export default function Layout({ children }: LayoutProps) {
  const { user, logout } = useAuthStore()
  const { currentShift } = useShiftStore()

  const { hasPermission } = useAuthStore()

  const navItems = [
    { to: '/pos', label: 'POS', icon: '🛒', show: true },
    { to: '/catalog', label: 'Products', icon: '📦', show: true },
    { to: '/shifts', label: 'Shifts', icon: '⏱️', show: true },
    { to: '/payments', label: 'History', icon: '💳', show: true },
    { to: '/supervisor', label: 'Admin', icon: '👤', show: hasPermission('pos:approval.grant') },
  ].filter(item => item.show)

  return (
    <div className="h-full flex flex-col">
      <header className="bg-indigo-600 text-white px-4 py-3 flex items-center justify-between shadow-lg">
        <div className="flex items-center gap-3">
          <h1 className="font-bold text-lg">WebWaka POS</h1>
          {currentShift && (
            <span className="bg-emerald-500 text-xs px-2 py-1 rounded-full">
              Shift Open
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-sm opacity-90">{user?.name}</span>
          <button 
            onClick={logout}
            className="text-xs bg-indigo-700 px-3 py-1 rounded hover:bg-indigo-800"
          >
            Logout
          </button>
        </div>
      </header>

      <main className="flex-1 overflow-auto p-4">
        {children}
      </main>

      <nav className="bg-white border-t border-gray-200 flex justify-around py-2 safe-area-bottom">
        {navItems.map(item => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              `flex flex-col items-center gap-1 px-4 py-2 rounded-lg transition-colors ${
                isActive ? 'text-indigo-600 bg-indigo-50' : 'text-gray-500'
              }`
            }
          >
            <span className="text-xl">{item.icon}</span>
            <span className="text-xs font-medium">{item.label}</span>
          </NavLink>
        ))}
      </nav>
    </div>
  )
}

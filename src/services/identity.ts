import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDBStorage } from '@/shared/utils/indexedDBStorage'

export interface User {
  id: string
  username: string
  name: string
  role: 'cashier' | 'supervisor' | 'manager' | 'admin'
  locationId: string
  locationName: string
  permissions: string[]
}

interface AuthState {
  user: User | null
  token: string | null
  isLoading: boolean
  error: string | null
  login: (username: string, password: string, locationId: string) => Promise<void>
  logout: () => void
  initSession: () => void
  hasPermission: (permission: string) => boolean
}

const mockUsers: Record<string, { password: string; user: Omit<User, 'locationId' | 'locationName'> }> = {
  cashier: {
    password: '1234',
    user: {
      id: 'USR001',
      username: 'cashier',
      name: 'John Cashier',
      role: 'cashier',
      permissions: ['pos:sale.create', 'pos:sale.void', 'pos:receipt.view'],
    },
  },
  supervisor: {
    password: '1234',
    user: {
      id: 'USR002',
      username: 'supervisor',
      name: 'Jane Supervisor',
      role: 'supervisor',
      permissions: [
        'pos:sale.create',
        'pos:sale.void',
        'pos:receipt.view',
        'pos:shift.open',
        'pos:shift.close',
        'pos:shift.xreport',
        'pos:shift.zreport',
        'pos:inventory.adjust',
        'pos:cash.movement',
        'pos:approval.grant',
      ],
    },
  },
  manager: {
    password: '1234',
    user: {
      id: 'USR003',
      username: 'manager',
      name: 'Bob Manager',
      role: 'manager',
      permissions: [
        'pos:sale.create',
        'pos:sale.void',
        'pos:receipt.view',
        'pos:shift.open',
        'pos:shift.close',
        'pos:shift.xreport',
        'pos:shift.zreport',
        'pos:inventory.adjust',
        'pos:cash.movement',
        'pos:approval.grant',
        'pos:reports.view',
        'pos:settings.edit',
      ],
    },
  },
}

const mockLocations: Record<string, string> = {
  LOC001: 'Main Store',
  LOC002: 'Branch 1',
  LOC003: 'Branch 2',
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      token: null,
      isLoading: false,
      error: null,

      login: async (username: string, password: string, locationId: string) => {
        set({ isLoading: true, error: null })

        await new Promise((r) => setTimeout(r, 500))

        const userData = mockUsers[username]
        if (!userData || userData.password !== password) {
          set({ isLoading: false, error: 'Invalid username or password' })
          return
        }

        const user: User = {
          ...userData.user,
          locationId,
          locationName: mockLocations[locationId] || 'Unknown Location',
        }

        set({
          user,
          token: `mock-token-${Date.now()}`,
          isLoading: false,
          error: null,
        })
      },

      logout: () => {
        set({ user: null, token: null, error: null })
      },

      initSession: () => {
        // Session is restored from persist middleware
      },

      hasPermission: (permission: string) => {
        const { user } = get()
        if (!user) return false
        if (user.role === 'admin') return true
        return user.permissions.includes(permission)
      },
    }),
    {
      name: 'webwaka-auth',
      storage: createJSONStorage(() => indexedDBStorage),
      partialize: (state) => ({ user: state.user, token: state.token }),
    }
  )
)

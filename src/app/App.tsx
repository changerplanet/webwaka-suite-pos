import { Routes, Route, Navigate } from 'react-router-dom'
import { useEffect } from 'react'
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus'
import { useAuthStore } from '@/services/identity'
import { useShiftStore } from '@/modules/shifts/shiftStore'
import { useCartStore } from '@/modules/pos/cartStore'
import { startSyncMonitor } from '@/services/syncService'
import { db } from '@/data/db'
import Layout from './Layout'
import POSPage from '@/modules/pos/POSPage'
import CatalogPage from '@/modules/catalog/CatalogPage'
import ShiftsPage from '@/modules/shifts/ShiftsPage'
import PaymentsPage from '@/modules/payments/PaymentsPage'
import SupervisorDashboard from '@/modules/pos/SupervisorDashboard'
import LoginPage from './LoginPage'
import OfflineBanner from '@/shared/ui/OfflineBanner'

export default function App() {
  const { isOnline } = useNetworkStatus()
  const { user, initSession } = useAuthStore()
  const { loadCurrentShift } = useShiftStore()
  const { initCart } = useCartStore()

  useEffect(() => {
    const initApp = async () => {
      await db.open()
      initSession()
    }
    initApp().catch(console.error)
  }, [initSession])

  useEffect(() => {
    if (user) {
      loadCurrentShift()
      initCart()
      const cleanup = startSyncMonitor()
      return cleanup
    }
  }, [user, loadCurrentShift, initCart])

  if (!user) {
    return (
      <>
        {!isOnline && <OfflineBanner />}
        <LoginPage />
      </>
    )
  }

  return (
    <>
      {!isOnline && <OfflineBanner />}
      <Layout>
        <Routes>
          <Route path="/" element={<Navigate to="/pos" replace />} />
          <Route path="/pos" element={<POSPage />} />
          <Route path="/catalog" element={<CatalogPage />} />
          <Route path="/shifts" element={<ShiftsPage />} />
          <Route path="/payments" element={<PaymentsPage />} />
          <Route path="/supervisor" element={<SupervisorDashboard />} />
        </Routes>
      </Layout>
    </>
  )
}

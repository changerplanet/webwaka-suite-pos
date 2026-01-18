import { useState } from 'react'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/data/db'
import { useAuthStore } from '@/services/identity'
import { formatCurrency } from '@/shared/utils/currency'
import InventoryAdjustmentModal from './components/InventoryAdjustmentModal'
import CashMovementModal from './components/CashMovementModal'

export default function SupervisorDashboard() {
  const { hasPermission, user } = useAuthStore()
  const [showInventoryModal, setShowInventoryModal] = useState(false)
  const [showCashModal, setShowCashModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'adjustments' | 'movements'>('overview')

  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)

  const transactions = useLiveQuery(
    () => db.transactions.where('offlineCreatedAt').above(todayStart.getTime()).toArray(),
    []
  )

  const adjustments = useLiveQuery(
    () => db.inventoryAdjustments.where('locationId').equals(user?.locationId || '').toArray(),
    [user?.locationId]
  )

  const cashMovements = useLiveQuery(
    () => db.cashMovements.orderBy('createdAt').reverse().limit(20).toArray(),
    []
  )

  const shifts = useLiveQuery(
    () => db.shifts.where('locationId').equals(user?.locationId || '').toArray(),
    [user?.locationId]
  )

  const todaySales = transactions?.reduce((sum, t) => sum + t.paymentAmount, 0) || 0
  const todayCount = transactions?.length || 0
  const pendingAdjustments = adjustments?.filter(a => a.status === 'pending').length || 0
  const pendingMovements = cashMovements?.filter(m => m.status === 'pending').length || 0

  if (!hasPermission('pos:reports.view') && !hasPermission('pos:approval.grant')) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500">You don't have permission to view this dashboard.</p>
      </div>
    )
  }

  const handleApproveAdjustment = async (id: string) => {
    if (!user) return
    const adjustment = await db.inventoryAdjustments.get(id)
    if (!adjustment) return

    await db.inventoryAdjustments.update(id, {
      status: 'approved',
      approvedBy: user.id,
      approvedByName: user.name,
      approvedAt: Date.now(),
    })

    const product = await db.products.get(adjustment.productId)
    if (product) {
      await db.products.update(adjustment.productId, {
        stockQuantity: product.stockQuantity + adjustment.quantityChange,
      })
    }
  }

  const handleApproveMovement = async (id: string) => {
    if (!user) return
    const movement = await db.cashMovements.get(id)
    if (!movement) return

    await db.cashMovements.update(id, {
      status: 'approved',
      approvedBy: user.id,
      approvedByName: user.name,
      approvedAt: Date.now(),
    })

    const shift = await db.shifts.get(movement.shiftId)
    if (shift) {
      const adjustment = movement.type === 'drop' ? -movement.amount : movement.amount
      await db.shifts.update(movement.shiftId, {
        expectedCash: shift.expectedCash + adjustment,
      })
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-xl font-bold">Supervisor Dashboard</h1>
          <span className="text-sm text-gray-500">{user?.locationName}</span>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-4">
          <div className="bg-indigo-50 p-4 rounded-lg">
            <p className="text-sm text-indigo-600">Today's Sales</p>
            <p className="text-2xl font-bold text-indigo-800">{formatCurrency(todaySales)}</p>
            <p className="text-xs text-indigo-500">{todayCount} transactions</p>
          </div>
          <div className="bg-amber-50 p-4 rounded-lg">
            <p className="text-sm text-amber-600">Pending Approvals</p>
            <p className="text-2xl font-bold text-amber-800">{pendingAdjustments + pendingMovements}</p>
            <p className="text-xs text-amber-500">{pendingAdjustments} adj, {pendingMovements} mov</p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={() => setShowInventoryModal(true)}
            className="btn btn-outline flex-1"
          >
            📦 Inventory Adj.
          </button>
          <button
            onClick={() => setShowCashModal(true)}
            className="btn btn-outline flex-1"
          >
            💰 Cash Movement
          </button>
        </div>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {(['overview', 'adjustments', 'movements'] as const).map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded-full whitespace-nowrap capitalize ${
              activeTab === tab ? 'bg-indigo-600 text-white' : 'bg-white text-gray-600'
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {activeTab === 'overview' && (
        <div className="card">
          <h2 className="font-bold mb-3">Active Shifts</h2>
          {shifts?.filter(s => s.status === 'open').map(shift => (
            <div key={shift.id} className="p-3 bg-emerald-50 rounded-lg mb-2">
              <div className="flex justify-between">
                <span className="font-medium">{shift.openedByName}</span>
                <span className="text-sm text-emerald-600">
                  {new Date(shift.openedAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-emerald-700">
                Sales: {formatCurrency(shift.salesTotal)} ({shift.salesCount} txns)
              </p>
            </div>
          ))}
          {!shifts?.some(s => s.status === 'open') && (
            <p className="text-gray-400 text-center py-4">No active shifts</p>
          )}
        </div>
      )}

      {activeTab === 'adjustments' && (
        <div className="space-y-2">
          {adjustments?.map(adj => (
            <div key={adj.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium">{adj.productName}</p>
                  <p className="text-sm text-gray-500">
                    {adj.quantityChange > 0 ? '+' : ''}{adj.quantityChange} • {adj.reason}
                  </p>
                  <p className="text-xs text-gray-400">
                    By {adj.createdByName} • {new Date(adj.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500 mt-1">{adj.notes}</p>
                </div>
                <div className="text-right">
                  {adj.status === 'pending' ? (
                    <button
                      onClick={() => handleApproveAdjustment(adj.id)}
                      className="btn btn-success text-xs"
                    >
                      Approve
                    </button>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Approved
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!adjustments || adjustments.length === 0) && (
            <div className="card text-center text-gray-400 py-4">
              No inventory adjustments
            </div>
          )}
        </div>
      )}

      {activeTab === 'movements' && (
        <div className="space-y-2">
          {cashMovements?.map(mov => (
            <div key={mov.id} className="card">
              <div className="flex justify-between items-start">
                <div>
                  <p className="font-medium capitalize">{mov.type.replace('_', ' ')}</p>
                  <p className="text-lg font-bold text-gray-800">{formatCurrency(mov.amount)}</p>
                  <p className="text-xs text-gray-400">
                    By {mov.createdByName} • {new Date(mov.createdAt).toLocaleString()}
                  </p>
                  <p className="text-xs text-gray-500">{mov.reason}</p>
                </div>
                <div className="text-right">
                  {mov.status === 'pending' ? (
                    <button
                      onClick={() => handleApproveMovement(mov.id)}
                      className="btn btn-success text-xs"
                    >
                      Approve
                    </button>
                  ) : (
                    <span className="text-xs px-2 py-1 rounded-full bg-emerald-100 text-emerald-700">
                      Approved
                    </span>
                  )}
                </div>
              </div>
            </div>
          ))}
          {(!cashMovements || cashMovements.length === 0) && (
            <div className="card text-center text-gray-400 py-4">
              No cash movements
            </div>
          )}
        </div>
      )}

      {showInventoryModal && (
        <InventoryAdjustmentModal
          onClose={() => setShowInventoryModal(false)}
          onComplete={() => setShowInventoryModal(false)}
        />
      )}

      {showCashModal && (
        <CashMovementModal
          onClose={() => setShowCashModal(false)}
          onComplete={() => setShowCashModal(false)}
        />
      )}
    </div>
  )
}

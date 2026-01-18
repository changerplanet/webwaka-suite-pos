import { useLiveQuery } from 'dexie-react-hooks'
import { db } from '@/data/db'
import { formatCurrency } from '@/shared/utils/currency'
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus'

export default function PaymentsPage() {
  const { isOnline } = useNetworkStatus()

  const transactions = useLiveQuery(
    () => db.transactions.orderBy('offlineCreatedAt').reverse().limit(50).toArray(),
    []
  )

  const syncQueue = useLiveQuery(() => db.syncQueue.count(), [])

  const getMethodIcon = (method: string) => {
    switch (method) {
      case 'CASH': return '💵'
      case 'BANK_TRANSFER': return '🏦'
      case 'CARD': return '💳'
      case 'MOBILE': return '📱'
      default: return '💰'
    }
  }

  const getStatusColor = (syncStatus: string) => {
    switch (syncStatus) {
      case 'synced': return 'bg-emerald-100 text-emerald-700'
      case 'pending': return 'bg-amber-100 text-amber-700'
      case 'failed': return 'bg-red-100 text-red-700'
      default: return 'bg-gray-100 text-gray-700'
    }
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-bold mb-4">Payment History</h1>

        <div className="flex gap-4 mb-4">
          <div className={`flex-1 p-4 rounded-lg ${isOnline ? 'bg-emerald-50' : 'bg-amber-50'}`}>
            <p className={`text-sm ${isOnline ? 'text-emerald-700' : 'text-amber-700'}`}>
              Connection Status
            </p>
            <p className={`font-bold ${isOnline ? 'text-emerald-800' : 'text-amber-800'}`}>
              {isOnline ? 'Online' : 'Offline'}
            </p>
          </div>
          <div className="flex-1 p-4 rounded-lg bg-indigo-50">
            <p className="text-sm text-indigo-700">Pending Sync</p>
            <p className="font-bold text-indigo-800">{syncQueue || 0} items</p>
          </div>
        </div>
      </div>

      <div className="space-y-2">
        {transactions?.map(tx => (
          <div key={tx.id} className="card">
            <div className="flex justify-between items-start">
              <div className="flex gap-3">
                <span className="text-2xl">{getMethodIcon(tx.paymentMethod)}</span>
                <div>
                  <p className="font-bold text-gray-800">{formatCurrency(tx.paymentAmount)}</p>
                  <p className="text-sm text-gray-500">
                    {new Date(tx.offlineCreatedAt).toLocaleString()}
                  </p>
                  {tx.referenceNumber && (
                    <p className="text-xs text-gray-400">Ref: {tx.referenceNumber}</p>
                  )}
                </div>
              </div>
              <div className="text-right">
                <span className={`text-xs px-2 py-1 rounded-full ${getStatusColor(tx.syncStatus)}`}>
                  {tx.syncStatus}
                </span>
                {tx.changeGiven > 0 && (
                  <p className="text-xs text-gray-500 mt-1">
                    Change: {formatCurrency(tx.changeGiven)}
                  </p>
                )}
              </div>
            </div>
          </div>
        ))}

        {(!transactions || transactions.length === 0) && (
          <div className="card text-center text-gray-400 py-8">
            No transactions yet
          </div>
        )}
      </div>
    </div>
  )
}

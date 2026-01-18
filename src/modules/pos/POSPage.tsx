import { useState } from 'react'
import { useShiftStore } from '@/modules/shifts/shiftStore'
import ProductSearch from './components/ProductSearch'
import Cart from './components/Cart'
import PaymentModal from './components/PaymentModal'
import { useCartStore } from './cartStore'
import { formatCurrency } from '@/shared/utils/currency'

export default function POSPage() {
  const { currentShift } = useShiftStore()
  const { activeCart, clearCart } = useCartStore()
  const [showPayment, setShowPayment] = useState(false)

  if (!currentShift) {
    return (
      <div className="h-full flex items-center justify-center">
        <div className="text-center p-8 card max-w-md">
          <div className="text-6xl mb-4">⏱️</div>
          <h2 className="text-xl font-bold text-gray-800 mb-2">No Active Shift</h2>
          <p className="text-gray-500 mb-4">
            Open a shift from the Shifts tab to start selling.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col gap-4">
      <div className="card">
        <ProductSearch />
      </div>

      <div className="flex-1 overflow-hidden">
        <Cart />
      </div>

      <div className="card flex items-center justify-between">
        <div>
          <p className="text-gray-500 text-sm">Total</p>
          <p className="text-2xl font-bold text-gray-800">
            {formatCurrency(activeCart?.grandTotal || 0)}
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={clearCart}
            disabled={!activeCart || activeCart.lineItems.length === 0}
            className="btn btn-outline"
          >
            Clear
          </button>
          <button
            onClick={() => setShowPayment(true)}
            disabled={!activeCart || activeCart.lineItems.length === 0}
            className="btn btn-success px-8"
          >
            Pay
          </button>
        </div>
      </div>

      {showPayment && (
        <PaymentModal
          onClose={() => setShowPayment(false)}
          onComplete={() => {
            setShowPayment(false)
          }}
        />
      )}
    </div>
  )
}

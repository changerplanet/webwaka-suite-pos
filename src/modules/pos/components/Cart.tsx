import { useEffect } from 'react'
import { useCartStore } from '../cartStore'
import { formatCurrency } from '@/shared/utils/currency'

export default function Cart() {
  const { activeCart, initCart, updateQuantity, removeFromCart } = useCartStore()

  useEffect(() => {
    initCart()
  }, [initCart])

  if (!activeCart || activeCart.lineItems.length === 0) {
    return (
      <div className="h-full flex items-center justify-center card">
        <div className="text-center text-gray-400">
          <p className="text-4xl mb-2">🛒</p>
          <p>Cart is empty</p>
          <p className="text-sm">Search for products to add</p>
        </div>
      </div>
    )
  }

  return (
    <div className="h-full flex flex-col card">
      <div className="flex-1 overflow-y-auto">
        {activeCart.lineItems.map((item) => (
          <div
            key={item.id}
            className="flex items-center gap-3 py-3 border-b border-gray-100 last:border-0"
          >
            <div className="flex-1">
              <p className="font-medium text-gray-800">{item.productName}</p>
              <p className="text-sm text-gray-500">
                {formatCurrency(item.unitPrice)} each
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
              >
                -
              </button>
              <span className="w-8 text-center font-medium">{item.quantity}</span>
              <button
                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-gray-600 hover:bg-gray-200"
              >
                +
              </button>
            </div>

            <div className="w-24 text-right">
              <p className="font-bold text-gray-800">
                {formatCurrency(item.lineTotal)}
              </p>
            </div>

            <button
              onClick={() => removeFromCart(item.id)}
              className="text-red-500 hover:text-red-600 p-2"
            >
              ✕
            </button>
          </div>
        ))}
      </div>

      <div className="border-t border-gray-200 pt-3 mt-3 space-y-1">
        <div className="flex justify-between text-sm text-gray-500">
          <span>Subtotal</span>
          <span>{formatCurrency(activeCart.subtotal)}</span>
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>VAT (7.5%)</span>
          <span>{formatCurrency(activeCart.totalTax)}</span>
        </div>
        {activeCart.roundingAdjustment !== 0 && (
          <div className="flex justify-between text-sm text-gray-400">
            <span>Rounding</span>
            <span>{formatCurrency(activeCart.roundingAdjustment)}</span>
          </div>
        )}
      </div>
    </div>
  )
}

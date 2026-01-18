import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db, Cart, CartLineItem, Product, Transaction } from '@/data/db'
import { calculateCartTotals } from '@/shared/utils/currency'
import { useAuthStore } from '@/services/identity'
import { useShiftStore } from '@/modules/shifts/shiftStore'

interface CartState {
  activeCart: Cart | null
  isLoading: boolean
  initCart: () => Promise<void>
  addToCart: (product: Product, quantity?: number) => Promise<void>
  updateQuantity: (lineItemId: string, quantity: number) => Promise<void>
  removeFromCart: (lineItemId: string) => Promise<void>
  clearCart: () => Promise<void>
  completeTransaction: (
    paymentMethod: 'CASH' | 'BANK_TRANSFER' | 'CARD' | 'MOBILE',
    paymentAmount: number,
    referenceNumber?: string
  ) => Promise<Transaction>
}

export const useCartStore = create<CartState>((set, get) => ({
  activeCart: null,
  isLoading: false,

  initCart: async () => {
    const existingCart = await db.carts.where({ status: 'active' }).first()
    if (existingCart) {
      set({ activeCart: existingCart })
    }
  },

  addToCart: async (product: Product, quantity = 1) => {
    let { activeCart } = get()

    if (!activeCart) {
      activeCart = {
        id: uuidv4(),
        status: 'active',
        lineItems: [],
        subtotal: 0,
        totalTax: 0,
        totalDiscount: 0,
        grandTotal: 0,
        roundingAdjustment: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      }
      await db.carts.add(activeCart)
    }

    const existingItem = activeCart.lineItems.find(
      (item) => item.productId === product.id
    )

    let updatedLineItems: CartLineItem[]

    if (existingItem) {
      updatedLineItems = activeCart.lineItems.map((item) => {
        if (item.productId === product.id) {
          const newQty = item.quantity + quantity
          const lineTotal = product.price * newQty
          const lineTax = lineTotal * product.taxRate
          return {
            ...item,
            quantity: newQty,
            lineTotal,
            lineTax,
          }
        }
        return item
      })
    } else {
      const lineTotal = product.price * quantity
      const lineTax = lineTotal * product.taxRate
      const newItem: CartLineItem = {
        id: uuidv4(),
        productId: product.id,
        productName: product.name,
        quantity,
        unitPrice: product.price,
        taxRate: product.taxRate,
        discount: 0,
        lineTotal,
        lineTax,
      }
      updatedLineItems = [...activeCart.lineItems, newItem]
    }

    const totals = calculateCartTotals(updatedLineItems)
    const updatedCart: Cart = {
      ...activeCart,
      lineItems: updatedLineItems,
      ...totals,
      updatedAt: Date.now(),
    }

    await db.carts.update(activeCart.id, updatedCart)
    set({ activeCart: updatedCart })
  },

  updateQuantity: async (lineItemId: string, quantity: number) => {
    const { activeCart } = get()
    if (!activeCart) return

    const updatedLineItems = activeCart.lineItems
      .map((item) => {
        if (item.id === lineItemId) {
          if (quantity <= 0) return null
          const lineTotal = item.unitPrice * quantity
          const lineTax = lineTotal * item.taxRate
          return { ...item, quantity, lineTotal, lineTax }
        }
        return item
      })
      .filter(Boolean) as CartLineItem[]

    const totals = calculateCartTotals(updatedLineItems)
    const updatedCart: Cart = {
      ...activeCart,
      lineItems: updatedLineItems,
      ...totals,
      updatedAt: Date.now(),
    }

    await db.carts.update(activeCart.id, updatedCart)
    set({ activeCart: updatedCart })
  },

  removeFromCart: async (lineItemId: string) => {
    const { updateQuantity } = get()
    await updateQuantity(lineItemId, 0)
  },

  clearCart: async () => {
    const { activeCart } = get()
    if (!activeCart) return

    await db.carts.update(activeCart.id, { status: 'cancelled' })
    set({ activeCart: null })
  },

  completeTransaction: async (
    paymentMethod,
    paymentAmount,
    referenceNumber
  ) => {
    const { activeCart } = get()
    const user = useAuthStore.getState().user
    if (!activeCart || !user) throw new Error('No active cart or user')

    const changeGiven = paymentMethod === 'CASH' 
      ? Math.max(0, paymentAmount - activeCart.grandTotal)
      : 0

    const transaction: Transaction = {
      id: uuidv4(),
      cartId: activeCart.id,
      paymentMethod,
      paymentAmount: activeCart.grandTotal,
      changeGiven,
      referenceNumber,
      status: 'completed',
      syncStatus: 'pending',
      auditTrail: [
        {
          action: 'SALE_COMPLETED',
          userId: user.id,
          timestamp: Date.now(),
          details: {
            total: activeCart.grandTotal,
            paymentMethod,
            itemCount: activeCart.lineItems.length,
          },
        },
      ],
      offlineCreatedAt: Date.now(),
    }

    await db.transactions.add(transaction)
    await db.carts.update(activeCart.id, { status: 'completed' })
    await db.syncQueue.add({
      entityType: 'transaction',
      entityId: transaction.id,
      payload: { transaction, cart: activeCart },
      retries: 0,
      createdAt: Date.now(),
    })

    if (paymentMethod === 'CASH') {
      await useShiftStore.getState().updateSalesTotal(activeCart.grandTotal)
    }

    set({ activeCart: null })
    return transaction
  },
}))

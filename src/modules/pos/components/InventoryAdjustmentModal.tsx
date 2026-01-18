import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { db, InventoryAdjustment } from '@/data/db'
import { useAuthStore } from '@/services/identity'

interface InventoryAdjustmentModalProps {
  onClose: () => void
  onComplete: () => void
}

const adjustmentSchema = z.object({
  productId: z.string().min(1, 'Product is required'),
  quantityChange: z.number().int(),
  reason: z.enum(['damage', 'theft', 'correction', 'received', 'return']),
  notes: z.string().min(1, 'Notes are required'),
})

type AdjustmentForm = z.infer<typeof adjustmentSchema>

const reasons = [
  { id: 'damage' as const, label: 'Damage', icon: '💔' },
  { id: 'theft' as const, label: 'Theft', icon: '🚨' },
  { id: 'correction' as const, label: 'Correction', icon: '✏️' },
  { id: 'received' as const, label: 'Received', icon: '📦' },
  { id: 'return' as const, label: 'Return', icon: '↩️' },
]

export default function InventoryAdjustmentModal({ onClose, onComplete }: InventoryAdjustmentModalProps) {
  const { user, hasPermission } = useAuthStore()
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [products, setProducts] = useState<Array<{ id: string; name: string }>>([])

  const { register, handleSubmit, formState: { errors } } = useForm<AdjustmentForm>({
    resolver: zodResolver(adjustmentSchema),
    defaultValues: {
      reason: 'correction',
      quantityChange: 0,
      notes: '',
    },
  })

  useState(() => {
    db.products.toArray().then(prods => {
      setProducts(prods.map(p => ({ id: p.id, name: p.name })))
    })
  })

  const onSubmit = async (data: AdjustmentForm) => {
    if (!user) return
    setIsSubmitting(true)

    try {
      const product = products.find(p => p.id === data.productId)

      const adjustment: InventoryAdjustment = {
        id: uuidv4(),
        productId: data.productId,
        productName: product?.name || 'Unknown',
        quantityChange: data.quantityChange,
        reason: data.reason,
        notes: data.notes,
        createdBy: user.id,
        createdByName: user.name,
        createdAt: Date.now(),
        status: hasPermission('pos:approval.grant') ? 'approved' : 'pending',
        approvedBy: hasPermission('pos:approval.grant') ? user.id : undefined,
        approvedByName: hasPermission('pos:approval.grant') ? user.name : undefined,
        approvedAt: hasPermission('pos:approval.grant') ? Date.now() : undefined,
        locationId: user.locationId,
        syncStatus: 'pending',
      }

      await db.inventoryAdjustments.add(adjustment)
      await db.syncQueue.add({
        entityType: 'inventory_adjustment',
        entityId: adjustment.id,
        payload: adjustment,
        retries: 0,
        createdAt: Date.now(),
      })

      if (adjustment.status === 'approved') {
        const prod = await db.products.get(data.productId)
        if (prod) {
          await db.products.update(data.productId, {
            stockQuantity: prod.stockQuantity + data.quantityChange,
          })
        }
      }

      onComplete()
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Inventory Adjustment</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">×</button>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product
            </label>
            <select {...register('productId')} className="input">
              <option value="">Select product</option>
              {products.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>
            {errors.productId && (
              <p className="text-red-500 text-sm mt-1">{errors.productId.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Quantity Change
            </label>
            <input
              type="number"
              {...register('quantityChange', { valueAsNumber: true })}
              className="input"
              placeholder="Use negative for reductions"
            />
            {errors.quantityChange && (
              <p className="text-red-500 text-sm mt-1">{errors.quantityChange.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Reason
            </label>
            <div className="grid grid-cols-3 gap-2">
              {reasons.map(reason => (
                <label key={reason.id} className="cursor-pointer">
                  <input
                    type="radio"
                    {...register('reason')}
                    value={reason.id}
                    className="sr-only"
                  />
                  <div className="p-3 border-2 rounded-lg text-center hover:border-indigo-500 peer-checked:border-indigo-500 peer-checked:bg-indigo-50">
                    <span className="text-xl">{reason.icon}</span>
                    <p className="text-xs mt-1">{reason.label}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Notes
            </label>
            <textarea
              {...register('notes')}
              className="input"
              rows={3}
              placeholder="Describe the adjustment reason..."
            />
            {errors.notes && (
              <p className="text-red-500 text-sm mt-1">{errors.notes.message}</p>
            )}
          </div>

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
              {isSubmitting ? 'Saving...' : 'Save Adjustment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

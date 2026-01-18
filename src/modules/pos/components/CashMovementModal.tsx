import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { v4 as uuidv4 } from 'uuid'
import { db, CashMovement } from '@/data/db'
import { useAuthStore } from '@/services/identity'
import { useShiftStore } from '@/modules/shifts/shiftStore'
import { formatCurrency } from '@/shared/utils/currency'

interface CashMovementModalProps {
  onClose: () => void
  onComplete: () => void
}

const movementSchema = z.object({
  type: z.enum(['drop', 'pickup', 'float_adjustment']),
  amount: z.number().positive('Amount must be positive'),
  reason: z.string().min(1, 'Reason is required'),
})

type MovementForm = z.infer<typeof movementSchema>

const movementTypes = [
  { id: 'drop' as const, label: 'Cash Drop', icon: '⬇️', description: 'Move cash to safe' },
  { id: 'pickup' as const, label: 'Cash Pickup', icon: '⬆️', description: 'Add cash from safe' },
  { id: 'float_adjustment' as const, label: 'Float Adjustment', icon: '⚖️', description: 'Adjust register float' },
]

export default function CashMovementModal({ onClose, onComplete }: CashMovementModalProps) {
  const { user, hasPermission } = useAuthStore()
  const { currentShift } = useShiftStore()
  const [isSubmitting, setIsSubmitting] = useState(false)

  const { register, handleSubmit, watch, formState: { errors } } = useForm<MovementForm>({
    resolver: zodResolver(movementSchema),
    defaultValues: {
      type: 'drop',
      amount: 0,
      reason: '',
    },
  })

  const movementType = watch('type')

  const onSubmit = async (data: MovementForm) => {
    if (!user || !currentShift) return
    setIsSubmitting(true)

    try {
      const movement: CashMovement = {
        id: uuidv4(),
        type: data.type,
        amount: data.amount,
        fromLocation: data.type === 'drop' ? 'register' : 'safe',
        toLocation: data.type === 'drop' ? 'safe' : 'register',
        reason: data.reason,
        createdBy: user.id,
        createdByName: user.name,
        createdAt: Date.now(),
        status: hasPermission('pos:approval.grant') ? 'approved' : 'pending',
        approvedBy: hasPermission('pos:approval.grant') ? user.id : undefined,
        approvedByName: hasPermission('pos:approval.grant') ? user.name : undefined,
        approvedAt: hasPermission('pos:approval.grant') ? Date.now() : undefined,
        shiftId: currentShift.id,
        syncStatus: 'pending',
      }

      await db.cashMovements.add(movement)
      await db.syncQueue.add({
        entityType: 'cash_movement',
        entityId: movement.id,
        payload: movement,
        retries: 0,
        createdAt: Date.now(),
      })

      if (movement.status === 'approved') {
        const adjustment = data.type === 'drop' ? -data.amount : data.amount
        await db.shifts.update(currentShift.id, {
          expectedCash: currentShift.expectedCash + adjustment,
        })
      }

      onComplete()
    } finally {
      setIsSubmitting(false)
    }
  }

  if (!currentShift) {
    return (
      <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-xl p-6 w-full max-w-md">
          <p className="text-center text-gray-500">No active shift. Open a shift first.</p>
          <button onClick={onClose} className="btn btn-outline w-full mt-4">Close</button>
        </div>
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-xl p-6 w-full max-w-md">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">Cash Movement</h2>
          <button onClick={onClose} className="text-gray-400 text-2xl">×</button>
        </div>

        <div className="bg-indigo-50 p-4 rounded-lg mb-4">
          <p className="text-sm text-indigo-600">Current Expected Cash</p>
          <p className="text-2xl font-bold text-indigo-800">
            {formatCurrency(currentShift.expectedCash)}
          </p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Movement Type
            </label>
            <div className="space-y-2">
              {movementTypes.map(type => (
                <label key={type.id} className="flex items-center gap-3 p-3 border rounded-lg cursor-pointer hover:border-indigo-500">
                  <input
                    type="radio"
                    {...register('type')}
                    value={type.id}
                    className="w-4 h-4 text-indigo-600"
                  />
                  <span className="text-xl">{type.icon}</span>
                  <div>
                    <p className="font-medium">{type.label}</p>
                    <p className="text-xs text-gray-500">{type.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Amount (₦)
            </label>
            <input
              type="number"
              {...register('amount', { valueAsNumber: true })}
              className="input text-xl"
              step={100}
              min={0}
            />
            {errors.amount && (
              <p className="text-red-500 text-sm mt-1">{errors.amount.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reason
            </label>
            <input
              type="text"
              {...register('reason')}
              className="input"
              placeholder="Why is this movement needed?"
            />
            {errors.reason && (
              <p className="text-red-500 text-sm mt-1">{errors.reason.message}</p>
            )}
          </div>

          {movementType === 'drop' && (
            <div className="bg-amber-50 p-3 rounded-lg text-sm text-amber-700">
              This will reduce expected cash by the amount entered.
            </div>
          )}
          {movementType === 'pickup' && (
            <div className="bg-emerald-50 p-3 rounded-lg text-sm text-emerald-700">
              This will increase expected cash by the amount entered.
            </div>
          )}

          <div className="flex gap-2">
            <button type="button" onClick={onClose} className="btn btn-outline flex-1">
              Cancel
            </button>
            <button type="submit" disabled={isSubmitting} className="btn btn-primary flex-1">
              {isSubmitting ? 'Processing...' : 'Submit'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

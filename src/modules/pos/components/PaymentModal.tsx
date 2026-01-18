import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import QRCode from 'qrcode'
import { useCartStore } from '../cartStore'
import { useNetworkStatus } from '@/shared/hooks/useNetworkStatus'
import { formatCurrency } from '@/shared/utils/currency'

interface PaymentModalProps {
  onClose: () => void
  onComplete: () => void
}

const paymentSchema = z.object({
  method: z.enum(['CASH', 'BANK_TRANSFER', 'CARD', 'MOBILE']),
  amountTendered: z.number().min(0),
  referenceNumber: z.string().optional(),
})

type PaymentForm = z.infer<typeof paymentSchema>

export default function PaymentModal({ onClose, onComplete }: PaymentModalProps) {
  const { activeCart, completeTransaction } = useCartStore()
  const { isOnline } = useNetworkStatus()
  const [step, setStep] = useState<'method' | 'details' | 'receipt'>('method')
  const [selectedMethod, setSelectedMethod] = useState<PaymentForm['method'] | null>(null)
  const [receiptQR, setReceiptQR] = useState<string>('')
  const [isProcessing, setIsProcessing] = useState(false)

  const { register, handleSubmit, watch, setValue } = useForm<PaymentForm>({
    resolver: zodResolver(paymentSchema),
    defaultValues: {
      amountTendered: activeCart?.grandTotal || 0,
    },
  })

  const amountTendered = watch('amountTendered')
  const total = activeCart?.grandTotal || 0
  const change = selectedMethod === 'CASH' ? Math.max(0, amountTendered - total) : 0

  const paymentMethods = [
    { id: 'CASH' as const, label: 'Cash', icon: '💵', offlineAllowed: true },
    { id: 'BANK_TRANSFER' as const, label: 'Bank Transfer', icon: '🏦', offlineAllowed: true },
    { id: 'CARD' as const, label: 'Card', icon: '💳', offlineAllowed: false },
    { id: 'MOBILE' as const, label: 'Mobile Money', icon: '📱', offlineAllowed: false },
  ]

  const handleMethodSelect = (method: PaymentForm['method']) => {
    if (!isOnline && !paymentMethods.find(m => m.id === method)?.offlineAllowed) {
      return
    }
    setSelectedMethod(method)
    setValue('method', method)
    setStep('details')
  }

  const onSubmit = async (data: PaymentForm) => {
    if (!activeCart) return

    setIsProcessing(true)
    try {
      const transaction = await completeTransaction(
        data.method,
        data.amountTendered,
        data.referenceNumber
      )

      const receiptData = JSON.stringify({
        transactionId: transaction.id,
        total: total,
        method: data.method,
        timestamp: Date.now(),
      })
      const qr = await QRCode.toDataURL(receiptData)
      setReceiptQR(qr)
      setStep('receipt')
    } catch (error) {
      console.error('Payment failed:', error)
    } finally {
      setIsProcessing(false)
    }
  }

  const quickCashAmounts = [
    total,
    Math.ceil(total / 100) * 100,
    Math.ceil(total / 500) * 500,
    Math.ceil(total / 1000) * 1000,
  ].filter((v, i, a) => a.indexOf(v) === i)

  return (
    <div className="fixed inset-0 bg-black/50 flex items-end justify-center z-50">
      <div className="bg-white w-full max-w-lg rounded-t-2xl p-6 slide-up max-h-[90vh] overflow-y-auto">
        {step === 'method' && (
          <>
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Select Payment</h2>
              <button onClick={onClose} className="text-gray-400 text-2xl">×</button>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-500">Amount Due</p>
              <p className="text-3xl font-bold text-indigo-600">{formatCurrency(total)}</p>
            </div>

            <div className="grid grid-cols-2 gap-3">
              {paymentMethods.map((method) => {
                const disabled = !isOnline && !method.offlineAllowed
                return (
                  <button
                    key={method.id}
                    onClick={() => handleMethodSelect(method.id)}
                    disabled={disabled}
                    className={`p-4 rounded-xl border-2 flex flex-col items-center gap-2 transition-all ${
                      disabled
                        ? 'border-gray-200 bg-gray-50 text-gray-400 cursor-not-allowed'
                        : 'border-gray-200 hover:border-indigo-500 hover:bg-indigo-50'
                    }`}
                  >
                    <span className="text-3xl">{method.icon}</span>
                    <span className="font-medium">{method.label}</span>
                    {disabled && <span className="text-xs">Requires Internet</span>}
                  </button>
                )
              })}
            </div>
          </>
        )}

        {step === 'details' && (
          <form onSubmit={handleSubmit(onSubmit)}>
            <div className="flex justify-between items-center mb-6">
              <button type="button" onClick={() => setStep('method')} className="text-indigo-600">
                ← Back
              </button>
              <h2 className="text-xl font-bold">
                {paymentMethods.find(m => m.id === selectedMethod)?.label}
              </h2>
              <button type="button" onClick={onClose} className="text-gray-400 text-2xl">×</button>
            </div>

            <div className="text-center mb-6">
              <p className="text-gray-500">Amount Due</p>
              <p className="text-3xl font-bold text-indigo-600">{formatCurrency(total)}</p>
            </div>

            {selectedMethod === 'CASH' && (
              <>
                <div className="mb-4">
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Amount Tendered
                  </label>
                  <input
                    type="number"
                    {...register('amountTendered', { valueAsNumber: true })}
                    className="input text-2xl text-center"
                    min={total}
                    step={5}
                  />
                </div>

                <div className="flex flex-wrap gap-2 mb-4">
                  {quickCashAmounts.map((amount) => (
                    <button
                      key={amount}
                      type="button"
                      onClick={() => setValue('amountTendered', amount)}
                      className="btn btn-outline text-sm"
                    >
                      {formatCurrency(amount)}
                    </button>
                  ))}
                </div>

                {change > 0 && (
                  <div className="bg-emerald-50 text-emerald-700 p-4 rounded-lg mb-4 text-center">
                    <p className="text-sm">Change Due</p>
                    <p className="text-2xl font-bold">{formatCurrency(change)}</p>
                  </div>
                )}
              </>
            )}

            {selectedMethod === 'BANK_TRANSFER' && (
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Reference Number
                </label>
                <input
                  type="text"
                  {...register('referenceNumber')}
                  className="input"
                  placeholder="Enter transfer reference"
                />
              </div>
            )}

            <button
              type="submit"
              disabled={isProcessing || (selectedMethod === 'CASH' && amountTendered < total)}
              className="btn btn-success w-full"
            >
              {isProcessing ? 'Processing...' : 'Complete Payment'}
            </button>
          </form>
        )}

        {step === 'receipt' && (
          <>
            <div className="text-center mb-6">
              <div className="text-6xl mb-4">✅</div>
              <h2 className="text-2xl font-bold text-emerald-600">Payment Complete!</h2>
              <p className="text-gray-500 mt-2">{formatCurrency(total)}</p>
            </div>

            {receiptQR && (
              <div className="flex justify-center mb-6">
                <img src={receiptQR} alt="Receipt QR Code" className="w-48 h-48" />
              </div>
            )}

            <p className="text-center text-sm text-gray-500 mb-6">
              Scan QR code for digital receipt
            </p>

            <button onClick={onComplete} className="btn btn-primary w-full">
              New Sale
            </button>
          </>
        )}
      </div>
    </div>
  )
}

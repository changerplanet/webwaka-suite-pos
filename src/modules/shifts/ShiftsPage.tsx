import { useState, useEffect } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useShiftStore } from './shiftStore'
import { useAuthStore } from '@/services/identity'
import { formatCurrency } from '@/shared/utils/currency'

const openShiftSchema = z.object({
  registerId: z.string().min(1, 'Register is required'),
  openingFloat: z.number().min(0, 'Float must be positive'),
})

type OpenShiftForm = z.infer<typeof openShiftSchema>

const closeShiftSchema = z.object({
  actualCash: z.number().min(0, 'Cash must be positive'),
})

type CloseShiftForm = z.infer<typeof closeShiftSchema>

export default function ShiftsPage() {
  const { currentShift, loadCurrentShift, openShift, generateXReport, generateZReport, isLoading } = useShiftStore()
  const { hasPermission } = useAuthStore()
  const [showOpenModal, setShowOpenModal] = useState(false)
  const [showCloseModal, setShowCloseModal] = useState(false)
  const [lastReport, setLastReport] = useState<{ type: string; data: unknown } | null>(null)

  useEffect(() => {
    loadCurrentShift()
  }, [loadCurrentShift])

  const openForm = useForm<OpenShiftForm>({
    resolver: zodResolver(openShiftSchema),
    defaultValues: { registerId: 'REG001', openingFloat: 10000 },
  })

  const closeForm = useForm<CloseShiftForm>({
    resolver: zodResolver(closeShiftSchema),
    defaultValues: { actualCash: currentShift?.expectedCash || 0 },
  })

  const handleOpenShift = async (data: OpenShiftForm) => {
    await openShift(data.registerId, data.openingFloat)
    setShowOpenModal(false)
  }

  const handleXReport = async () => {
    const report = await generateXReport()
    setLastReport({ type: 'X-Report', data: report })
  }

  const handleZReport = async (data: CloseShiftForm) => {
    const report = await generateZReport(data.actualCash)
    setLastReport({ type: 'Z-Report', data: report })
    setShowCloseModal(false)
  }

  if (!hasPermission('pos:shift.open')) {
    return (
      <div className="card text-center py-8">
        <p className="text-gray-500">You don't have permission to manage shifts.</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="card">
        <h1 className="text-xl font-bold mb-4">Shift Management</h1>

        {!currentShift ? (
          <div className="text-center py-8">
            <p className="text-gray-500 mb-4">No active shift</p>
            <button
              onClick={() => setShowOpenModal(true)}
              className="btn btn-primary"
            >
              Open Shift
            </button>
          </div>
        ) : (
          <div>
            <div className="bg-emerald-50 p-4 rounded-lg mb-4">
              <div className="flex justify-between items-center mb-2">
                <span className="text-emerald-700 font-medium">Shift Active</span>
                <span className="text-sm text-emerald-600">
                  {new Date(currentShift.openedAt).toLocaleTimeString()}
                </span>
              </div>
              <p className="text-sm text-emerald-600">
                Opened by {currentShift.openedByName}
              </p>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-4">
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500 text-sm">Sales Count</p>
                <p className="text-2xl font-bold">{currentShift.salesCount}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500 text-sm">Sales Total</p>
                <p className="text-2xl font-bold">{formatCurrency(currentShift.salesTotal)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500 text-sm">Opening Float</p>
                <p className="text-xl font-bold">{formatCurrency(currentShift.openingFloat)}</p>
              </div>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-gray-500 text-sm">Expected Cash</p>
                <p className="text-xl font-bold">{formatCurrency(currentShift.expectedCash)}</p>
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={handleXReport} className="btn btn-outline flex-1">
                X-Report
              </button>
              <button
                onClick={() => {
                  closeForm.setValue('actualCash', currentShift.expectedCash)
                  setShowCloseModal(true)
                }}
                className="btn btn-danger flex-1"
              >
                Close Shift
              </button>
            </div>
          </div>
        )}
      </div>

      {lastReport && (
        <div className="card">
          <h2 className="font-bold mb-2">{lastReport.type}</h2>
          <pre className="bg-gray-50 p-4 rounded-lg text-sm overflow-x-auto">
            {JSON.stringify(lastReport.data, null, 2)}
          </pre>
          <button
            onClick={() => setLastReport(null)}
            className="mt-2 text-sm text-gray-500"
          >
            Dismiss
          </button>
        </div>
      )}

      {showOpenModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Open Shift</h2>
            <form onSubmit={openForm.handleSubmit(handleOpenShift)} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Register
                </label>
                <select {...openForm.register('registerId')} className="input">
                  <option value="REG001">Register 1</option>
                  <option value="REG002">Register 2</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Opening Float (₦)
                </label>
                <input
                  type="number"
                  {...openForm.register('openingFloat', { valueAsNumber: true })}
                  className="input"
                  step={100}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowOpenModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-primary flex-1"
                >
                  Open Shift
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showCloseModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl p-6 w-full max-w-md">
            <h2 className="text-xl font-bold mb-4">Close Shift & Z-Report</h2>
            <form onSubmit={closeForm.handleSubmit(handleZReport)} className="space-y-4">
              <div className="bg-amber-50 p-4 rounded-lg">
                <p className="text-amber-700 text-sm">Expected Cash in Drawer</p>
                <p className="text-2xl font-bold text-amber-800">
                  {formatCurrency(currentShift?.expectedCash || 0)}
                </p>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Actual Cash Counted (₦)
                </label>
                <input
                  type="number"
                  {...closeForm.register('actualCash', { valueAsNumber: true })}
                  className="input text-xl"
                  step={5}
                />
              </div>
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => setShowCloseModal(false)}
                  className="btn btn-outline flex-1"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isLoading}
                  className="btn btn-danger flex-1"
                >
                  Close & Generate Z-Report
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

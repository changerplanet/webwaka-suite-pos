import { create } from 'zustand'
import { v4 as uuidv4 } from 'uuid'
import { db, Shift, XReport, ZReport } from '@/data/db'
import { useAuthStore } from '@/services/identity'

interface ShiftState {
  currentShift: Shift | null
  isLoading: boolean
  error: string | null
  loadCurrentShift: () => Promise<void>
  openShift: (registerId: string, openingFloat: number) => Promise<Shift>
  closeShift: (actualCash: number) => Promise<void>
  generateXReport: () => Promise<XReport>
  generateZReport: (actualCash: number, approvedBy?: string) => Promise<ZReport>
  updateSalesTotal: (amount: number) => Promise<void>
}

export const useShiftStore = create<ShiftState>((set, get) => ({
  currentShift: null,
  isLoading: false,
  error: null,

  loadCurrentShift: async () => {
    set({ isLoading: true })
    const user = useAuthStore.getState().user
    if (!user) {
      set({ isLoading: false, currentShift: null })
      return
    }

    const openShifts = await db.shifts
      .where({ locationId: user.locationId, status: 'open' })
      .toArray()

    const myShift = openShifts.find(s => s.openedBy === user.id)
    set({ currentShift: myShift || null, isLoading: false })
  },

  openShift: async (registerId: string, openingFloat: number) => {
    const user = useAuthStore.getState().user
    if (!user) throw new Error('Not authenticated')

    const shift: Shift = {
      id: uuidv4(),
      registerId,
      locationId: user.locationId,
      openedBy: user.id,
      openedByName: user.name,
      openedAt: Date.now(),
      openingFloat,
      expectedCash: openingFloat,
      salesCount: 0,
      salesTotal: 0,
      status: 'open',
      xReports: [],
      syncStatus: 'pending',
    }

    await db.shifts.add(shift)
    await db.syncQueue.add({
      entityType: 'shift',
      entityId: shift.id,
      payload: { action: 'open', shift },
      retries: 0,
      createdAt: Date.now(),
    })

    set({ currentShift: shift })
    return shift
  },

  closeShift: async (actualCash: number) => {
    const { currentShift } = get()
    const user = useAuthStore.getState().user
    if (!currentShift || !user) throw new Error('No active shift')

    const cashDifference = actualCash - currentShift.expectedCash

    const updatedShift: Shift = {
      ...currentShift,
      closedBy: user.id,
      closedByName: user.name,
      closedAt: Date.now(),
      actualCash,
      cashDifference,
      status: 'closed',
    }

    await db.shifts.update(currentShift.id, updatedShift)
    await db.syncQueue.add({
      entityType: 'shift',
      entityId: currentShift.id,
      payload: { action: 'close', shift: updatedShift },
      retries: 0,
      createdAt: Date.now(),
    })

    set({ currentShift: null })
  },

  generateXReport: async () => {
    const { currentShift } = get()
    const user = useAuthStore.getState().user
    if (!currentShift || !user) throw new Error('No active shift')

    const transactions = await db.transactions
      .where('offlineCreatedAt')
      .between(currentShift.openedAt, Date.now())
      .toArray()

    const report: XReport = {
      id: uuidv4(),
      generatedAt: Date.now(),
      generatedBy: user.name,
      salesCount: transactions.length,
      salesTotal: transactions.reduce((sum, t) => sum + t.paymentAmount, 0),
      cashTotal: transactions.filter(t => t.paymentMethod === 'CASH').reduce((sum, t) => sum + t.paymentAmount, 0),
      cardTotal: transactions.filter(t => t.paymentMethod === 'CARD').reduce((sum, t) => sum + t.paymentAmount, 0),
      transferTotal: transactions.filter(t => t.paymentMethod === 'BANK_TRANSFER').reduce((sum, t) => sum + t.paymentAmount, 0),
    }

    const updatedShift = {
      ...currentShift,
      xReports: [...currentShift.xReports, report],
    }

    await db.shifts.update(currentShift.id, { xReports: updatedShift.xReports })
    set({ currentShift: updatedShift })

    return report
  },

  generateZReport: async (actualCash: number, approvedBy?: string) => {
    const { currentShift, closeShift } = get()
    const user = useAuthStore.getState().user
    if (!currentShift || !user) throw new Error('No active shift')

    const transactions = await db.transactions
      .where('offlineCreatedAt')
      .between(currentShift.openedAt, Date.now())
      .toArray()

    const report: ZReport = {
      id: uuidv4(),
      generatedAt: Date.now(),
      generatedBy: user.name,
      approvedBy,
      approvedAt: approvedBy ? Date.now() : undefined,
      salesCount: transactions.length,
      salesTotal: transactions.reduce((sum, t) => sum + t.paymentAmount, 0),
      cashTotal: transactions.filter(t => t.paymentMethod === 'CASH').reduce((sum, t) => sum + t.paymentAmount, 0),
      cardTotal: transactions.filter(t => t.paymentMethod === 'CARD').reduce((sum, t) => sum + t.paymentAmount, 0),
      transferTotal: transactions.filter(t => t.paymentMethod === 'BANK_TRANSFER').reduce((sum, t) => sum + t.paymentAmount, 0),
      expectedCash: currentShift.expectedCash,
      actualCash,
      variance: actualCash - currentShift.expectedCash,
    }

    await db.shifts.update(currentShift.id, { zReport: report })
    await closeShift(actualCash)

    return report
  },

  updateSalesTotal: async (amount: number) => {
    const { currentShift } = get()
    if (!currentShift) return

    const updatedShift = {
      ...currentShift,
      salesCount: currentShift.salesCount + 1,
      salesTotal: currentShift.salesTotal + amount,
      expectedCash: currentShift.expectedCash + amount,
    }

    await db.shifts.update(currentShift.id, {
      salesCount: updatedShift.salesCount,
      salesTotal: updatedShift.salesTotal,
      expectedCash: updatedShift.expectedCash,
    })

    set({ currentShift: updatedShift })
  },
}))

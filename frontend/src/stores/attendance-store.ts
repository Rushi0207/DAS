'use client'

import { create } from 'zustand'

type AttendanceState = {
  sessionId: number | null
  selectedStudentIds: number[]
  setSessionId: (sessionId: number | null) => void
  toggleStudent: (studentId: number) => void
  markAllPresent: (studentIds: number[]) => void
  clearAll: () => void
  reset: () => void
}

export const useAttendanceStore = create<AttendanceState>((set) => ({
  sessionId: null,
  selectedStudentIds: [],
  setSessionId: (sessionId) => set({ sessionId }),
  toggleStudent: (studentId) =>
    set((state) => ({
      selectedStudentIds: state.selectedStudentIds.includes(studentId)
        ? state.selectedStudentIds.filter((id) => id !== studentId)
        : [...state.selectedStudentIds, studentId],
    })),
  markAllPresent: (studentIds) => set({ selectedStudentIds: studentIds }),
  clearAll: () => set({ selectedStudentIds: [] }),
  reset: () => set({ sessionId: null, selectedStudentIds: [] }),
}))

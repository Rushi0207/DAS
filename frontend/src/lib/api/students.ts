import { apiFetch } from './client'
import type { Student } from '@/types/api'

export function getStudents(params?: { isActive?: boolean; search?: string }) {
  const q = new URLSearchParams()
  if (params?.isActive !== undefined) q.set('isActive', String(params.isActive))
  if (params?.search)                 q.set('search',   params.search)
  const qs = q.toString()
  return apiFetch<{ students: Student[] }>(`/students${qs ? `?${qs}` : ''}`)
}

export function createStudent(body: {
  firstName: string
  lastName: string
  studentId: string
  email?: string
}) {
  return apiFetch<{ student: Student }>('/students', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateStudent(id: number, body: Partial<{
  firstName: string
  lastName: string
  studentId: string
  email: string | null
  isActive: boolean
}>) {
  return apiFetch<{ student: Student }>(`/students/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deactivateStudent(id: number) {
  return apiFetch<{ student: Student }>(`/students/${id}`, { method: 'DELETE' })
}

export type ImportRow = { firstName: string; lastName: string; studentId: string; email?: string }
export type ImportResult = {
  created: Student[]
  skipped: Array<{ studentId: string; reason: string }>
  errors:  Array<{ studentId: string; reason: string }>
}

export function importStudents(rows: ImportRow[]) {
  return apiFetch<ImportResult>('/students/import', {
    method: 'POST',
    body: JSON.stringify({ rows }),
  })
}

import { apiFetch } from './client'
import type { Teacher } from '@/types/api'

export function getTeachers(params?: { department?: string }) {
  const q = new URLSearchParams()
  if (params?.department) q.set('department', params.department)
  const qs = q.toString()
  return apiFetch<{ teachers: Teacher[] }>(`/teachers${qs ? `?${qs}` : ''}`)
}

export function createTeacher(body: {
  userId: number
  firstName: string
  lastName: string
  employeeId: string
  department?: string
}) {
  return apiFetch<{ teacher: Teacher }>('/teachers', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateTeacher(id: number, body: Partial<{
  firstName: string
  lastName: string
  employeeId: string
  department: string
}>) {
  return apiFetch<{ teacher: Teacher }>(`/teachers/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function getMyTeacherProfile() {
  return apiFetch<{ teacher: Teacher }>('/teachers/me')
}

export function getTeacherAssignments(teacherId: number) {
  return apiFetch<{ assignments: Array<{ id: number; classSubjectId: number; isActive: boolean }> }>(`/teachers/${teacherId}/assignments?isActive=true`)
}

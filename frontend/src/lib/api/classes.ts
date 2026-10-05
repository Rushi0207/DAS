import { apiFetch } from './client'
import type { DasClass, ClassSubject, Enrollment } from '@/types/api'

export function getClasses(params?: { academicYear?: string; isActive?: boolean }) {
  const q = new URLSearchParams()
  if (params?.academicYear)            q.set('academicYear', params.academicYear)
  if (params?.isActive !== undefined)  q.set('isActive',     String(params.isActive))
  const qs = q.toString()
  return apiFetch<{ classes: DasClass[] }>(`/classes${qs ? `?${qs}` : ''}`)
}

export function createClass(body: {
  name: string
  academicYear: string
  division?: string
  advisorId?: number
}) {
  return apiFetch<{ class: DasClass }>('/classes', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getClassSubjects(classId: number, params?: { isActive?: boolean }) {
  const q = new URLSearchParams()
  if (params?.isActive !== undefined) q.set('isActive', String(params.isActive))
  const qs = q.toString()
  return apiFetch<{ classSubjects: ClassSubject[] }>(`/classes/${classId}/subjects${qs ? `?${qs}` : ''}`)
}

export function linkSubjectToClass(classId: number, body: {
  subjectId: number
  academicYear: string
}) {
  return apiFetch<{ classSubject: ClassSubject }>(`/classes/${classId}/subjects`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getClassEnrollments(classId: number, params?: { academicYear?: string; isActive?: boolean }) {
  const q = new URLSearchParams()
  if (params?.academicYear)            q.set('academicYear', params.academicYear)
  if (params?.isActive !== undefined)  q.set('isActive',     String(params.isActive))
  const qs = q.toString()
  return apiFetch<{ enrollments: Enrollment[] }>(`/classes/${classId}/enrollments${qs ? `?${qs}` : ''}`)
}

export function enrollStudent(classId: number, body: {
  studentId: number
  academicYear: string
  rollNumber: string
}) {
  return apiFetch<{ enrollment: Enrollment }>(`/classes/${classId}/enrollments`, {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateClass(id: number, body: Partial<{
  name: string
  academicYear: string
  division: string | null
  isActive: boolean
  advisorId: number | null
}>) {
  return apiFetch<{ class: DasClass }>(`/classes/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

import { apiFetch } from './client'
import type { Subject, ClassSubject, TeacherAssignment } from '@/types/api'

export function getSubjects(params?: { search?: string }) {
  const q = new URLSearchParams()
  if (params?.search) q.set('search', params.search)
  const qs = q.toString()
  return apiFetch<{ subjects: Subject[] }>(`/subjects${qs ? `?${qs}` : ''}`)
}

export function createSubject(body: { name: string; code: string }) {
  return apiFetch<{ subject: Subject }>('/subjects', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getAllClassSubjects(params?: { isActive?: boolean; academicYear?: string }) {
  const q = new URLSearchParams()
  if (params?.isActive !== undefined) q.set('isActive',     String(params.isActive))
  if (params?.academicYear)           q.set('academicYear', params.academicYear)
  const qs = q.toString()
  return apiFetch<{ classSubjects: ClassSubject[] }>(`/class-subjects${qs ? `?${qs}` : ''}`)
}

export function getAssignmentsByClassSubject(classSubjectId: number) {
  return apiFetch<{ assignments: TeacherAssignment[] }>(`/class-subjects/${classSubjectId}/assignments`)
}

export function assignTeacher(classSubjectId: number, teacherId: number) {
  return apiFetch<{ assignment: TeacherAssignment }>(`/class-subjects/${classSubjectId}/assignments`, {
    method: 'POST',
    body: JSON.stringify({ teacherId }),
  })
}

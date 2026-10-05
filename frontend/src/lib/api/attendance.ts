import { apiFetch } from './client'
import type { AttendanceSession, AttendanceSubmitResult } from '@/types/api'

export function createSession(body: {
  classSubjectId: number
  sessionDate: string
  startTime?: string
  notes?: string
}) {
  return apiFetch<{ session: AttendanceSession }>('/attendance/sessions', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getSessions(params?: { classSubjectId?: number; teacherId?: number; sessionDate?: string }) {
  const q = new URLSearchParams()
  if (params?.classSubjectId) q.set('classSubjectId', String(params.classSubjectId))
  if (params?.teacherId)      q.set('teacherId',      String(params.teacherId))
  if (params?.sessionDate)    q.set('sessionDate',    params.sessionDate)
  const qs = q.toString()
  return apiFetch<{ sessions: AttendanceSession[] }>(`/attendance/sessions${qs ? `?${qs}` : ''}`)
}

export function submitAttendance(sessionId: number, presentStudentIds: number[]) {
  return apiFetch<AttendanceSubmitResult>(`/attendance/sessions/${sessionId}/submit`, {
    method: 'POST',
    body: JSON.stringify({ presentStudentIds }),
  })
}

export function getSessionRecords(sessionId: number) {
  return apiFetch<{
    session: AttendanceSession
    summary: { totalRecords: number; totalPresent: number; totalAbsent: number }
    records: {
      present: Array<{ id: number; studentId: number; status: string; student: { id: number; firstName: string; lastName: string; studentId: string } }>
      absent:  Array<{ id: number; studentId: number; status: string; student: { id: number; firstName: string; lastName: string; studentId: string } }>
    }
  }>(`/attendance/sessions/${sessionId}/records`)
}

export function updateAttendanceRecord(recordId: number, status: 'PRESENT' | 'ABSENT') {
  return apiFetch<{ record: { id: number; studentId: number; status: string; student: { id: number; firstName: string; lastName: string; studentId: string } } }>(
    `/attendance/records/${recordId}`,
    { method: 'PATCH', body: JSON.stringify({ status }) },
  )
}

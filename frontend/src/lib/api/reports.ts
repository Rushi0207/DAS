import { apiFetch } from './client'

export function getSubjectReport(classSubjectId: number) {
  return apiFetch<{
    report: {
      classSubject: { id: number; academicYear: string; class: { id: number; name: string; academicYear: string }; subject: { id: number; name: string; code: string } }
      totalSessions: number
      totalStudents: number
      students: Array<{
        enrollmentId: number
        rollNumber: string
        student: { id: number; firstName: string; lastName: string; studentId: string }
        totalSessions: number
        present: number
        absent: number
        percentage: number | null
      }>
    }
  }>(`/reports/subject?classSubjectId=${classSubjectId}`)
}

export function getLowAttendanceReport(classSubjectId: number, threshold = 75) {
  return apiFetch<{
    report: {
      classSubject: { id: number; class: { name: string }; subject: { name: string; code: string } }
      totalSessions: number
      threshold: number
      totalStudents: number
      lowAttendanceCount: number
      students: Array<{
        enrollmentId: number
        rollNumber: string
        student: { id: number; firstName: string; lastName: string; studentId: string }
        totalSessions: number
        present: number
        absent: number
        percentage: number | null
      }>
    }
  }>(`/reports/low-attendance?classSubjectId=${classSubjectId}&threshold=${threshold}`)
}

export function getStudentReport(studentId: number, academicYear?: string) {
  const q = new URLSearchParams({ studentId: String(studentId) })
  if (academicYear) q.set('academicYear', academicYear)
  return apiFetch<{
    report: {
      student: { id: number; firstName: string; lastName: string; studentId: string; email?: string | null }
      subjects: Array<{
        classSubjectId: number
        class: { id: number; name: string; academicYear: string }
        subject: { id: number; name: string; code: string }
        academicYear: string
        rollNumber: string
        totalSessions: number
        present: number
        absent: number
        percentage: number | null
      }>
    }
  }>(`/reports/student?${q.toString()}`)
}

export function getClassReport(classId: number, academicYear: string) {
  return apiFetch<{
    report: {
      class: { id: number; name: string; academicYear: string; division?: string | null }
      academicYear: string
      subjects: Array<{ id: number; subject: { name: string; code: string }; sessionCount: number }>
      totalSessions: number
      totalStudents: number
      students: Array<{
        enrollmentId: number
        rollNumber: string
        student: { id: number; firstName: string; lastName: string; studentId: string }
        totalSessions: number
        present: number
        absent: number
        percentage: number | null
      }>
    }
  }>(`/reports/class?classId=${classId}&academicYear=${encodeURIComponent(academicYear)}`)
}

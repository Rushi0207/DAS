export type Role = 'Administrator' | 'Class Advisor' | 'Subject Teacher'

// ─── Response envelope ────────────────────────────────────────────────────────

export interface ApiResponse<T> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: {
    code: string
    message: string
    details?: Record<string, string[]>
  }
}

// ─── Domain types ─────────────────────────────────────────────────────────────

export interface User {
  id: number
  username: string
  email: string
  isActive: boolean
  role: Role
  roleId?: number
  createdAt?: string
  updatedAt?: string
}

export interface RoleRecord {
  id: number
  name: Role
}

export interface Teacher {
  id: number
  userId: number
  firstName: string
  lastName: string
  fullName: string
  employeeId: string
  department?: string | null
  user: Pick<User, 'id' | 'username' | 'email' | 'isActive'> & { role: { name: Role } }
  createdAt?: string
  updatedAt?: string
}

export interface Student {
  id: number
  firstName: string
  lastName: string
  fullName: string
  studentId: string
  email?: string | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface DasClass {
  id: number
  name: string
  academicYear: string
  division?: string | null
  advisorId?: number | null
  advisor?: {
    id: number
    firstName: string
    lastName: string
    employeeId: string
  } | null
  isActive: boolean
  createdAt?: string
  updatedAt?: string
}

export interface Subject {
  id: number
  name: string
  code: string
  createdAt?: string
  updatedAt?: string
}

export interface ClassSubject {
  id: number
  classId: number
  subjectId: number
  academicYear: string
  isActive: boolean
  class: Pick<DasClass, 'id' | 'name' | 'academicYear' | 'division'>
  subject: Pick<Subject, 'id' | 'name' | 'code'>
  createdAt?: string
  updatedAt?: string
}

export interface TeacherAssignment {
  id: number
  teacherId: number
  classSubjectId: number
  isActive: boolean
  teacher: Pick<Teacher, 'id' | 'firstName' | 'lastName' | 'employeeId'>
  classSubject: Pick<ClassSubject, 'id' | 'academicYear' | 'class' | 'subject'>
  createdAt?: string
  updatedAt?: string
}

export interface Enrollment {
  id: number
  studentId: number
  classId: number
  academicYear: string
  rollNumber: string
  isActive: boolean
  student: Pick<Student, 'id' | 'firstName' | 'lastName' | 'studentId' | 'email'>
  class: Pick<DasClass, 'id' | 'name' | 'academicYear' | 'division'>
  createdAt?: string
  updatedAt?: string
}

export interface AttendanceSession {
  id: number
  classSubjectId: number
  teacherId: number
  sessionDate: string
  startTime?: string | null
  notes?: string | null
  classSubject?: ClassSubject
  teacher?: Pick<Teacher, 'id' | 'firstName' | 'lastName' | 'employeeId'>
  createdAt?: string
  updatedAt?: string
}

export interface AttendanceRecord {
  id: number
  sessionId: number
  studentId: number
  status: 'PRESENT' | 'ABSENT'
  student: Pick<Student, 'id' | 'firstName' | 'lastName' | 'studentId'>
  createdAt?: string
  updatedAt?: string
}

export interface AttendanceSubmitResult {
  sessionId: number
  classSubjectId: number
  class: Pick<DasClass, 'id' | 'name' | 'academicYear'>
  subject: Pick<Subject, 'id' | 'name' | 'code'>
  sessionDate: string
  totalEnrolled: number
  totalPresent: number
  totalAbsent: number
  presentStudentIds: number[]
  absentStudentIds: number[]
}

export interface AttendanceSummary {
  student: Pick<Student, 'id' | 'firstName' | 'lastName' | 'studentId'>
  classSubject: Pick<ClassSubject, 'id' | 'academicYear' | 'class' | 'subject'>
  totalSessions: number
  present: number
  absent: number
  percentage: number | null
}

// ─── Dashboard types ──────────────────────────────────────────────────────────

export interface AdminDashboard {
  role: 'Administrator'
  stats: {
    users: { total: number; active: number }
    teachers: { total: number }
    students: { total: number; active: number }
    classes: { total: number }
    subjects: { total: number }
    classSubjects: { total: number }
    assignments: { total: number }
    enrollments: { total: number }
    sessions: { total: number }
    attendanceRate: number | null
  }
  recentSessions: Array<{
    id: number
    sessionDate: string
    class: Pick<DasClass, 'name' | 'academicYear'>
    subject: Pick<Subject, 'name' | 'code'>
    teacher: Pick<Teacher, 'firstName' | 'lastName' | 'employeeId'>
  }>
}

export interface TeacherDashboard {
  role: 'Subject Teacher'
  teacher: Pick<Teacher, 'id' | 'firstName' | 'lastName' | 'employeeId'>
  stats: {
    assignedSubjects: number
    totalSessions: number
  }
  subjects: Array<{
    assignmentId: number
    classSubjectId: number
    class: Pick<DasClass, 'id' | 'name' | 'academicYear' | 'division'>
    subject: Pick<Subject, 'id' | 'name' | 'code'>
    enrolledStudents: number
    sessionsConducted: number
    attendanceRate: number | null
  }>
  recentSessions: Array<{
    id: number
    sessionDate: string
    class: Pick<DasClass, 'name'>
    subject: Pick<Subject, 'name' | 'code'>
  }>
}

export interface AdvisorDashboard {
  role: 'Class Advisor'
  teacher: Pick<Teacher, 'id' | 'firstName' | 'lastName' | 'employeeId'>
  stats: {
    assignedClassSubjects: number
    totalLowAttendanceStudents: number
  }
  classes: Array<{
    class: Pick<DasClass, 'id' | 'name' | 'academicYear' | 'division'>
    enrolledStudents: number
    sessionsConducted: number
  }>
  recentSessions: Array<{
    id: number
    sessionDate: string
    class: Pick<DasClass, 'name'>
    subject: Pick<Subject, 'name' | 'code'>
  }>
}

export type Dashboard = AdminDashboard | TeacherDashboard | AdvisorDashboard

// ─── Auth types ───────────────────────────────────────────────────────────────

export interface LoginResponse {
  token: string
  user: User
}

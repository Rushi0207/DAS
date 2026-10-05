import { useEffect, useState } from 'react'
import { FileBarChart, Search } from 'lucide-react'
import { getAllClassSubjects } from '@/lib/api/subjects'
import { getClasses } from '@/lib/api/classes'
import { getStudents } from '@/lib/api/students'
import {
  getSubjectReport,
  getLowAttendanceReport,
  getStudentReport,
  getClassReport,
} from '@/lib/api/reports'
import type { ClassSubject, DasClass, Student } from '@/types/api'

type ReportType = 'subject' | 'low' | 'student' | 'class'

type ReportRow = {
  enrollmentId?: number
  rollNumber?: string
  student: { id: number; firstName: string; lastName: string; studentId: string }
  totalSessions: number
  present: number
  absent: number
  percentage: number | null
  // student-wise extra fields
  subjectName?: string
  subjectCode?: string
  classNameLabel?: string
  academicYear?: string
}

export default function Reports() {
  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [classes, setClasses]             = useState<DasClass[]>([])
  const [students, setStudents]           = useState<Student[]>([])

  const [reportType, setReportType]   = useState<ReportType>('subject')
  const [selectedCsId, setSelectedCsId]     = useState<number>(0)
  const [selectedClassId, setSelectedClassId] = useState<number>(0)
  const [selectedStudentId, setSelectedStudentId] = useState<number>(0)
  const [academicYear, setAcademicYear] = useState('2025-26')
  const [threshold, setThreshold]       = useState(75)

  const [rows, setRows]             = useState<ReportRow[]>([])
  const [totalSessions, setTotalSessions] = useState(0)
  const [reportLabel, setReportLabel]     = useState('')
  const [loading, setLoading]             = useState(false)
  const [error, setError]                 = useState<string | null>(null)
  const [search, setSearch]               = useState('')

  // Load reference data on mount
  useEffect(() => {
    getAllClassSubjects({ isActive: true })
      .then(r => {
        setClassSubjects(r.classSubjects)
        if (r.classSubjects.length > 0) setSelectedCsId(r.classSubjects[0].id)
      })
      .catch(() => {})

    getClasses({ isActive: true })
      .then(r => {
        setClasses(r.classes)
        if (r.classes.length > 0) {
          setSelectedClassId(r.classes[0].id)
          setAcademicYear(r.classes[0].academicYear)
        }
      })
      .catch(() => {})

    getStudents({ isActive: true })
      .then(r => {
        setStudents(r.students)
        if (r.students.length > 0) setSelectedStudentId(r.students[0].id)
      })
      .catch(() => {})
  }, [])

  async function handleGenerate() {
    setLoading(true); setError(null); setRows([]); setTotalSessions(0)

    try {
      if (reportType === 'subject') {
        if (!selectedCsId) return
        const res = await getSubjectReport(selectedCsId)
        setRows(res.report.students)
        setTotalSessions(res.report.totalSessions)
        setReportLabel(`${res.report.classSubject.class.name} · ${res.report.classSubject.subject.name} (${res.report.classSubject.academicYear})`)

      } else if (reportType === 'low') {
        if (!selectedCsId) return
        const res = await getLowAttendanceReport(selectedCsId, threshold)
        setRows(res.report.students)
        setTotalSessions(res.report.totalSessions)
        setReportLabel(`${res.report.classSubject.class.name} · ${res.report.classSubject.subject.name} — below ${threshold}%`)

      } else if (reportType === 'student') {
        if (!selectedStudentId) return
        const res = await getStudentReport(selectedStudentId)
        // Flatten student subjects into rows
        const flattened: ReportRow[] = res.report.subjects.map(s => ({
          student:       res.report.student,
          totalSessions: s.totalSessions,
          present:       s.present,
          absent:        s.absent,
          percentage:    s.percentage,
          subjectName:   s.subject.name,
          subjectCode:   s.subject.code,
          classNameLabel: `${s.class.name} (${s.academicYear})`,
          rollNumber:    s.rollNumber,
        }))
        setRows(flattened)
        setTotalSessions(flattened.reduce((a, r) => a + r.totalSessions, 0))
        setReportLabel(`${res.report.student.firstName} ${res.report.student.lastName} (${res.report.student.studentId})`)

      } else if (reportType === 'class') {
        if (!selectedClassId || !academicYear) return
        const res = await getClassReport(selectedClassId, academicYear)
        setRows(res.report.students)
        setTotalSessions(res.report.totalSessions)
        setReportLabel(`${res.report.class.name} · ${academicYear} · ${res.report.subjects.length} subject(s)`)
      }
    } catch (e: any) {
      setError(e.message ?? 'Failed to generate report')
    } finally {
      setLoading(false)
    }
  }

  const filtered = rows.filter(r => {
    const name = `${r.student.firstName} ${r.student.lastName}`.toLowerCase()
    const sid  = r.student.studentId.toLowerCase()
    const q    = search.toLowerCase()
    return name.includes(q) || sid.includes(q)
  })

  const presentTotal = rows.reduce((s, r) => s + r.present, 0)
  const absentTotal  = rows.reduce((s, r) => s + r.absent, 0)

  const isStudentReport = reportType === 'student'

  return (
    <>
      <div className="page-heading">
        <div><h1>Attendance Reports</h1><p>Generate and review attendance performance.</p></div>
      </div>

      {/* ── Filter panel ── */}
      <div className="report-filters panel">
        <label>Report Type
          <select value={reportType} onChange={e => { setReportType(e.target.value as ReportType); setRows([]) }}>
            <option value="subject">Subject-wise</option>
            <option value="low">Low Attendance</option>
            <option value="student">Student-wise</option>
            <option value="class">Class-wise</option>
          </select>
        </label>

        {/* Subject-wise and Low Attendance — pick class-subject */}
        {(reportType === 'subject' || reportType === 'low') && (
          <label>Class — Subject
            <select value={selectedCsId} onChange={e => setSelectedCsId(Number(e.target.value))}>
              {classSubjects.map(cs => (
                <option key={cs.id} value={cs.id}>
                  {cs.class.name} · {cs.subject.code} ({cs.academicYear})
                </option>
              ))}
            </select>
          </label>
        )}

        {/* Low attendance — threshold */}
        {reportType === 'low' && (
          <label>Threshold (%)
            <input
              type="number" min={0} max={100}
              value={threshold}
              onChange={e => setThreshold(Number(e.target.value))}
              style={{ width: '80px' }}
            />
          </label>
        )}

        {/* Student-wise — pick student */}
        {reportType === 'student' && (
          <label>Student
            <select value={selectedStudentId} onChange={e => setSelectedStudentId(Number(e.target.value))}>
              {students.map(s => (
                <option key={s.id} value={s.id}>{s.fullName} ({s.studentId})</option>
              ))}
            </select>
          </label>
        )}

        {/* Class-wise — pick class + year */}
        {reportType === 'class' && (
          <>
            <label>Class
              <select
                value={selectedClassId}
                onChange={e => {
                  const id = Number(e.target.value)
                  setSelectedClassId(id)
                  const found = classes.find(c => c.id === id)
                  if (found) setAcademicYear(found.academicYear)
                }}
              >
                {classes.map(c => (
                  <option key={c.id} value={c.id}>{c.name} ({c.academicYear})</option>
                ))}
              </select>
            </label>
            <label>Academic Year
              <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} style={{ width: '100px' }}/>
            </label>
          </>
        )}

        <button className="primary-button compact" onClick={handleGenerate} disabled={loading}>
          <FileBarChart size={15}/> {loading ? 'Generating…' : 'Generate Report'}
        </button>
      </div>

      {/* ── Summary cards ── */}
      {rows.length > 0 && (
        <div className="stats-grid report-stats" style={{ marginTop: '1rem' }}>
          <div className="stat-card"><div className="stat-copy"><span>Sessions</span><strong>{totalSessions}</strong></div></div>
          <div className="stat-card"><div className="stat-copy"><span>Students / Rows</span><strong>{rows.length}</strong></div></div>
          <div className="stat-card"><div className="stat-copy"><span>Total Present</span><strong>{presentTotal}</strong></div></div>
          <div className="stat-card"><div className="stat-copy"><span>Total Absent</span><strong>{absentTotal}</strong></div></div>
        </div>
      )}

      {/* ── Results table ── */}
      {(rows.length > 0 || error) && (
        <section className="panel table-panel report-table" style={{ marginTop: '1rem' }}>
          <div className="panel-heading">
            <div>
              <h3>
                {reportType === 'subject' ? 'Subject-wise Attendance'
                  : reportType === 'low'  ? `Low Attendance (below ${threshold}%)`
                  : reportType === 'student' ? 'Student-wise Attendance'
                  : 'Class-wise Attendance'}
              </h3>
              <span>{reportLabel}</span>
            </div>
          </div>

          {error && <p style={{ color: 'red', padding: '1rem' }}>{error}</p>}

          <div className="toolbar" style={{ borderTop: 'none' }}>
            <div className="table-search">
              <Search size={15}/>
              <input
                placeholder="Search by name or student ID…"
                value={search}
                onChange={e => setSearch(e.target.value)}
              />
            </div>
          </div>

          <div className="table-wrap">
            <table>
              <thead>
                <tr>
                  <th>#</th>
                  {isStudentReport ? (
                    <>
                      <th>Subject</th>
                      <th>Class</th>
                      <th>Roll No.</th>
                    </>
                  ) : (
                    <>
                      <th>Roll No.</th>
                      <th>Student Name</th>
                      <th>Student ID</th>
                    </>
                  )}
                  <th>Sessions</th>
                  <th>Present</th>
                  <th>Absent</th>
                  <th>Percentage</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((row, i) => (
                  <tr key={i}>
                    <td>{i + 1}</td>
                    {isStudentReport ? (
                      <>
                        <td>{row.subjectCode} — {row.subjectName}</td>
                        <td>{row.classNameLabel}</td>
                        <td>{row.rollNumber ?? '—'}</td>
                      </>
                    ) : (
                      <>
                        <td>{row.rollNumber ?? '—'}</td>
                        <td>{row.student.firstName} {row.student.lastName}</td>
                        <td>{row.student.studentId}</td>
                      </>
                    )}
                    <td>{row.totalSessions}</td>
                    <td>{row.present}</td>
                    <td>{row.absent}</td>
                    <td>
                      {row.percentage !== null
                        ? <span className={`status ${row.percentage >= 75 ? 'active' : 'inactive'}`}>{row.percentage}%</span>
                        : <span className="status pending">N/A</span>
                      }
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={8} style={{ textAlign: 'center', padding: '1rem' }}>
                      No results found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </section>
      )}
    </>
  )
}

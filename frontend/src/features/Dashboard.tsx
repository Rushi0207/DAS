import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Activity, ArrowUpRight, BookOpen, CalendarCheck, ClipboardList, GraduationCap, ShieldCheck, UserRound, Users } from 'lucide-react'
import { getDashboard } from '@/lib/api/dashboard'
import { useAuthStore } from '@/stores/auth-store'
import type { AdminDashboard, TeacherDashboard, AdvisorDashboard } from '@/types/api'
import { routePaths } from '@/app/routes'

function StatCard({ icon: Icon, label, value, tone }: { icon: typeof Users; label: string; value: string; tone: string }) {
  return (
    <div className="stat-card">
      <div className={`stat-icon ${tone}`}><Icon size={19} /></div>
      <div className="stat-copy"><span>{label}</span><strong>{value}</strong></div>
    </div>
  )
}

function AdminView({ data }: { data: AdminDashboard }) {
  const navigate = useNavigate()
  const s = data.stats
  return (
    <>
      <div className="page-heading">
        <div><h1>Dashboard</h1><p>Here's what's happening across your institution.</p></div>
        <button className="outline-button" onClick={() => navigate(routePaths.Reports)}>View Reports <ArrowUpRight size={15} /></button>
      </div>
      <div className="stats-grid">
        <StatCard icon={Users}        label="Total Users"      value={String(s.users.total)}          tone="blue" />
        <StatCard icon={GraduationCap} label="Teachers"        value={String(s.teachers.total)}       tone="green" />
        <StatCard icon={UserRound}    label="Students"         value={String(s.students.active)}      tone="purple" />
        <StatCard icon={BookOpen}     label="Classes"          value={String(s.classes.total)}        tone="orange" />
        <StatCard icon={ClipboardList} label="Subjects"        value={String(s.subjects.total)}       tone="red" />
        <StatCard icon={ShieldCheck}  label="Assignments"      value={String(s.assignments.total)}    tone="amber" />
        <StatCard icon={Activity}     label="Enrollments"      value={String(s.enrollments.total)}    tone="violet" />
        <StatCard icon={CalendarCheck} label="Sessions"        value={String(s.sessions.total)}       tone="teal" />
        <StatCard icon={Activity}     label="Attendance Rate"  value={s.attendanceRate !== null ? `${s.attendanceRate}%` : 'N/A'} tone="blue" />
      </div>
      <div className="dashboard-grid">
        <section className="panel sessions">
          <div className="panel-heading">
            <div><h3>Recent Attendance Sessions</h3><span>Latest activity</span></div>
          </div>
          {data.recentSessions.length === 0
            ? <p className="muted" style={{ padding: '1rem' }}>No sessions yet.</p>
            : data.recentSessions.map((s, i) => (
              <div className="session-row" key={s.id}>
                <div className={`session-icon s${i % 3}`}><CalendarCheck size={16} /></div>
                <div>
                  <strong>{s.class.name} · {s.subject.name}</strong>
                  <span>{s.teacher.firstName} {s.teacher.lastName} · {new Date(s.sessionDate).toLocaleDateString()}</span>
                </div>
              </div>
            ))
          }
        </section>
      </div>
    </>
  )
}

function TeacherView({ data }: { data: TeacherDashboard }) {
  return (
    <>
      <div className="page-heading">
        <div><h1>Dashboard</h1><p>Welcome, {data.teacher.firstName}. Here are your assigned subjects.</p></div>
      </div>
      <div className="stats-grid">
        <StatCard icon={ClipboardList} label="Assigned Subjects" value={String(data.stats.assignedSubjects)} tone="blue" />
        <StatCard icon={CalendarCheck} label="Sessions Conducted" value={String(data.stats.totalSessions)} tone="green" />
      </div>
      <section className="panel table-panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-heading"><div><h3>Your Class-Subjects</h3></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Class</th><th>Subject</th><th>Enrolled</th><th>Sessions</th><th>Rate</th></tr></thead>
            <tbody>
              {data.subjects.map(s => (
                <tr key={s.classSubjectId}>
                  <td>{s.class.name} ({s.class.academicYear})</td>
                  <td>{s.subject.code} — {s.subject.name}</td>
                  <td>{s.enrolledStudents}</td>
                  <td>{s.sessionsConducted}</td>
                  <td>{s.attendanceRate !== null ? `${s.attendanceRate}%` : 'N/A'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

function AdvisorView({ data }: { data: AdvisorDashboard }) {
  return (
    <>
      <div className="page-heading">
        <div><h1>Dashboard</h1><p>Welcome, {data.teacher.firstName}. Here's your class overview.</p></div>
      </div>
      <div className="stats-grid">
        <StatCard icon={ClipboardList} label="Assigned Subjects" value={String(data.stats.assignedClassSubjects)} tone="blue" />
        <StatCard icon={UserRound}     label="Low Attendance"    value={String(data.stats.totalLowAttendanceStudents)} tone="red" />
      </div>
      <section className="panel table-panel" style={{ marginTop: '1.5rem' }}>
        <div className="panel-heading"><div><h3>Your Classes</h3></div></div>
        <div className="table-wrap">
          <table>
            <thead><tr><th>Class</th><th>Academic Year</th><th>Enrolled</th><th>Sessions</th></tr></thead>
            <tbody>
              {data.classes.map((c, i) => (
                <tr key={i}>
                  <td>{c.class.name}</td>
                  <td>{c.class.academicYear}</td>
                  <td>{c.enrolledStudents}</td>
                  <td>{c.sessionsConducted}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </>
  )
}

export default function Dashboard() {
  const { user } = useAuthStore()
  const [data, setData] = useState<AdminDashboard | TeacherDashboard | AdvisorDashboard | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    setLoading(true)
    getDashboard()
      .then(res => setData(res.dashboard))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <div className="page-heading"><div><h1>Dashboard</h1><p>Loading…</p></div></div>
  if (error)   return <div className="page-heading"><div><h1>Dashboard</h1><p className="muted">Failed to load: {error}</p></div></div>
  if (!data)   return null

  if (data.role === 'Administrator') return <AdminView data={data as AdminDashboard} />
  if (data.role === 'Subject Teacher') return <TeacherView data={data as TeacherDashboard} />
  return <AdvisorView data={data as AdvisorDashboard} />
}

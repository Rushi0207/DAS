import { useEffect, useState } from 'react'
import { BookOpen, Link, Pencil, Plus, Search, UserPlus, Users, X } from 'lucide-react'
import { getClasses, createClass, updateClass, linkSubjectToClass, getClassEnrollments, enrollStudent } from '@/lib/api/classes'
import { getSubjects } from '@/lib/api/subjects'
import { getTeachers, getMyTeacherProfile } from '@/lib/api/teachers'
import { getStudents } from '@/lib/api/students'
import { useAuthStore } from '@/stores/auth-store'
import type { DasClass, Subject, Teacher, Student, Enrollment } from '@/types/api'
import { ApiError } from '@/lib/api/client'

export default function Classes() {
  const { user } = useAuthStore()
  const isAdvisor = user?.role === 'Class Advisor'

  const [classes, setClasses] = useState<DasClass[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<DasClass | null>(null)
  const [linking, setLinking] = useState<DasClass | null>(null)
  const [managing, setManaging] = useState<DasClass | null>(null)

  function load() {
    setLoading(true)

    const fetchClasses = isAdvisor
      ? getMyTeacherProfile()
          .then(r => {
            const myTeacherId = r.teacher.id
            return getClasses().then(res => ({
              classes: res.classes.filter(c => c.advisorId === myTeacherId),
            }))
          })
      : getClasses()

    fetchClasses
      .then(r => setClasses(r.classes))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const colors = ['blue', 'green', 'purple', 'orange', 'red', 'amber']
  const filtered = classes.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.academicYear.includes(search)
  )

  return (
    <>
      <div className="page-heading">
        <div><h1>Classes</h1><p>Manage classes, assign advisors and subjects.</p></div>
      </div>

      <div className="cards-toolbar">
        <div className="table-search">
          <Search size={15}/>
          <input placeholder="Search classes…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        {!isAdvisor && (
          <button className="primary-button compact" onClick={() => setShowAdd(true)}>
            <Plus size={15}/> Add Class
          </button>
        )}
      </div>

      {loading ? <p style={{ padding: '1rem' }}>Loading…</p>
        : error ? <p style={{ color: 'red', padding: '1rem' }}>{error}</p>
        : (
          <div className="cards-grid">
            {filtered.map((c, i) => (
              <div className="class-card" key={c.id}>
                <div className={`class-icon ${colors[i % colors.length]}`}><BookOpen size={18}/></div>
                <h3>{c.name}</h3>
                <p>{c.academicYear}{c.division ? ` · Div ${c.division}` : ''}</p>
                <p style={{ fontSize: '0.8rem', color: 'var(--muted)' }}>
                  {c.advisor
                    ? <>Advisor: <strong>{c.advisor.firstName} {c.advisor.lastName}</strong></>
                    : <span style={{ opacity: 0.5 }}>No advisor assigned</span>
                  }
                </p>
                <p><span className={`status ${c.isActive ? 'active' : 'inactive'}`}>{c.isActive ? 'Active' : 'Inactive'}</span></p>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem' }}>
                  <button className="view-link" onClick={() => setLinking(c)}>
                    <Link size={13}/> Link Subject
                  </button>
                  <button className="view-link" onClick={() => setManaging(c)}>
                    <Users size={13}/> Students
                  </button>
                  {!isAdvisor && (
                    <button className="view-link" onClick={() => setEditing(c)}>
                      <Pencil size={13}/> Edit
                    </button>
                  )}
                </div>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="muted">
                {isAdvisor ? 'No class assigned to you yet. Ask the Administrator to assign you as Class Advisor for a class.' : 'No classes found.'}
              </p>
            )}
          </div>
        )
      }

      {showAdd && (
        <ClassModal
          mode="add"
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load() }}
        />
      )}

      {editing && (
        <ClassModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}

      {linking && (
        <LinkSubjectModal
          cls={linking}
          onClose={() => setLinking(null)}
          onSaved={() => { setLinking(null); load() }}
        />
      )}

      {managing && (
        <ManageStudentsModal
          cls={managing}
          onClose={() => setManaging(null)}
        />
      )}
    </>
  )
}

// ── Add / Edit Class modal ─────────────────────────────────────────────────────

function ClassModal({
  mode, initial, onClose, onSaved,
}: {
  mode: 'add' | 'edit'
  initial?: DasClass
  onClose: () => void
  onSaved: () => void
}) {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [form, setForm] = useState({
    name:         initial?.name         ?? '',
    academicYear: initial?.academicYear ?? '2025-26',
    division:     initial?.division     ?? '',
    advisorId:    initial?.advisorId    ?? 0,   // 0 = no advisor
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [done, setDone]     = useState(false)

  useEffect(() => {
    getTeachers()
      .then(r => setTeachers(r.teachers))
      .catch(() => {})
  }, [])

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      const advisorId = form.advisorId > 0 ? form.advisorId : undefined

      if (mode === 'add') {
        await createClass({
          name:         form.name,
          academicYear: form.academicYear,
          division:     form.division || undefined,
          advisorId,
        })
      } else {
        await updateClass(initial!.id, {
          name:         form.name,
          academicYear: form.academicYear,
          division:     form.division || null,
          // if 0 selected = clear the advisor (null); otherwise set the new one
          advisorId:    form.advisorId > 0 ? form.advisorId : null,
        })
      }
      setDone(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to save class')
    } finally { setSaving(false) }
  }

  const title = mode === 'add' ? 'Add Class' : 'Edit Class'

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal>
        <div className="modal-header">
          <div><p className="eyebrow">CLASS MANAGEMENT</p><h2>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>
        {done ? (
          <div className="modal-success">
            <h3>{mode === 'add' ? 'Class created' : 'Class updated'}</h3>
            <button className="primary-button" onClick={onSaved}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'red', padding: '0 1.5rem' }}>{error}</p>}
            <div className="modal-fields">
              <label>Class Name (e.g. TYCS-A)
                <input required value={form.name} onChange={e => set('name', e.target.value)}/>
              </label>
              <label>Academic Year (e.g. 2025-26)
                <input required value={form.academicYear} onChange={e => set('academicYear', e.target.value)}/>
              </label>
              <label>Division (optional)
                <input value={form.division} onChange={e => set('division', e.target.value)}/>
              </label>
              <label>Class Advisor (optional)
                <select
                  value={form.advisorId}
                  onChange={e => set('advisorId', Number(e.target.value))}
                >
                  <option value={0}>— No advisor assigned —</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.firstName} {t.lastName} ({t.employeeId}) — {t.user.role.name}
                    </option>
                  ))}
                </select>
                {teachers.length === 0 && (
                  <small style={{ color: 'var(--muted)', marginTop: '0.25rem', display: 'block' }}>
                    No teacher profiles found. Go to Teachers → Add Teacher first.
                  </small>
                )}
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="outline-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving…' : mode === 'add' ? 'Create Class' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

// ── Link Subject to Class modal ────────────────────────────────────────────────

function LinkSubjectModal({ cls, onClose, onSaved }: { cls: DasClass; onClose: () => void; onSaved: () => void }) {
  const [subjects, setSubjects]   = useState<Subject[]>([])
  const [subjectId, setSubjectId] = useState<number>(0)
  const [academicYear, setYear]   = useState(cls.academicYear)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [done, setDone]           = useState(false)

  useEffect(() => {
    getSubjects()
      .then(r => {
        setSubjects(r.subjects)
        if (r.subjects.length > 0) setSubjectId(r.subjects[0].id)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await linkSubjectToClass(cls.id, { subjectId, academicYear })
      setDone(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to link subject')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal>
        <div className="modal-header">
          <div><p className="eyebrow">ASSIGN SUBJECT</p><h2>Link Subject to {cls.name}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>
        {done ? (
          <div className="modal-success">
            <h3>Subject linked</h3>
            <p>The subject has been assigned to {cls.name}.</p>
            <button className="primary-button" onClick={onSaved}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'red', padding: '0 1.5rem' }}>{error}</p>}
            <div className="modal-fields">
              <label>Subject
                <select value={subjectId} onChange={e => setSubjectId(Number(e.target.value))}>
                  {subjects.map(s => <option key={s.id} value={s.id}>{s.code} — {s.name}</option>)}
                </select>
              </label>
              <label>Academic Year
                <input required value={academicYear} onChange={e => setYear(e.target.value)}/>
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="outline-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving || subjects.length === 0}>
                {saving ? 'Linking…' : 'Link Subject'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

// ── Manage Students modal ──────────────────────────────────────────────────────

function ManageStudentsModal({ cls, onClose }: { cls: DasClass; onClose: () => void }) {
  const [tab, setTab] = useState<'enrolled' | 'enroll'>('enrolled')

  // Enrolled students
  const [enrollments, setEnrollments] = useState<Enrollment[]>([])
  const [loadingEnrolled, setLoadingEnrolled] = useState(true)

  // All students for enrollment
  const [allStudents, setAllStudents]     = useState<Student[]>([])
  const [loadingStudents, setLoadingStudents] = useState(false)
  const [selected, setSelected]           = useState<Set<number>>(new Set())
  const [academicYear, setAcademicYear]   = useState(cls.academicYear)
  const [startRoll, setStartRoll]         = useState('1')
  const [enrolling, setEnrolling]         = useState(false)
  const [enrollResult, setEnrollResult]   = useState<{ created: number; skipped: number } | null>(null)
  const [error, setError]                 = useState<string | null>(null)

  function loadEnrolled() {
    setLoadingEnrolled(true)
    getClassEnrollments(cls.id, { isActive: true })
      .then(r => setEnrollments(r.enrollments))
      .catch(() => {})
      .finally(() => setLoadingEnrolled(false))
  }

  function loadAllStudents() {
    setLoadingStudents(true)
    getStudents({ isActive: true })
      .then(r => setAllStudents(r.students))
      .catch(() => {})
      .finally(() => setLoadingStudents(false))
  }

  useEffect(() => { loadEnrolled() }, [])

  useEffect(() => {
    if (tab === 'enroll') loadAllStudents()
  }, [tab])

  // Students not yet enrolled in this class for this year
  const enrolledStudentIds = new Set(enrollments.map(e => e.studentId))
  const unenrolled = allStudents.filter(s => !enrolledStudentIds.has(s.id))

  function toggleSelect(id: number) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function selectAll() { setSelected(new Set(unenrolled.map(s => s.id))) }
  function clearAll()  { setSelected(new Set()) }

  async function handleEnroll() {
    if (selected.size === 0) return
    setEnrolling(true); setError(null)

    let created = 0; let skipped = 0
    let roll = parseInt(startRoll, 10) || 1

    // Find current max roll to avoid conflicts
    const existingRolls = enrollments.map(e => parseInt(e.rollNumber, 10)).filter(n => !isNaN(n))
    const maxRoll = existingRolls.length > 0 ? Math.max(...existingRolls) : 0
    if (roll <= maxRoll) roll = maxRoll + 1

    for (const studentId of selected) {
      try {
        await enrollStudent(cls.id, { studentId, academicYear, rollNumber: String(roll) })
        created++; roll++
      } catch {
        skipped++
      }
    }

    setEnrollResult({ created, skipped })
    setSelected(new Set())
    loadEnrolled()
    setEnrolling(false)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal style={{ maxWidth: '600px', maxHeight: '85vh', display: 'flex', flexDirection: 'column' }}>
        <div className="modal-header">
          <div>
            <p className="eyebrow">CLASS STUDENTS</p>
            <h2>{cls.name} — {cls.academicYear}</h2>
          </div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>

        {/* Tabs */}
        <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', padding: '0 1.5rem' }}>
          {(['enrolled', 'enroll'] as const).map(t => (
            <button
              key={t}
              onClick={() => { setTab(t); setEnrollResult(null) }}
              style={{
                padding: '0.6rem 1rem',
                border: 'none',
                borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
                background: 'none',
                cursor: 'pointer',
                fontWeight: tab === t ? 600 : 400,
                color: tab === t ? 'var(--primary)' : 'var(--muted)',
              }}
            >
              {t === 'enrolled' ? `Enrolled (${enrollments.length})` : 'Enroll Students'}
            </button>
          ))}
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '1rem 1.5rem' }}>
          {tab === 'enrolled' ? (
            loadingEnrolled ? <p>Loading…</p> : enrollments.length === 0 ? (
              <p className="muted">No students enrolled yet. Use the "Enroll Students" tab.</p>
            ) : (
              <table style={{ width: '100%' }}>
                <thead><tr><th>#</th><th>Roll</th><th>Name</th><th>Student ID</th></tr></thead>
                <tbody>
                  {enrollments.map((e, i) => (
                    <tr key={e.id}>
                      <td>{i + 1}</td>
                      <td>{e.rollNumber}</td>
                      <td>{e.student.firstName} {e.student.lastName}</td>
                      <td>{e.student.studentId}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )
          ) : (
            <>
              {enrollResult && (
                <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '8px', padding: '0.75rem 1rem', marginBottom: '1rem' }}>
                  ✅ Enrolled: <strong>{enrollResult.created}</strong>
                  {enrollResult.skipped > 0 && <> &nbsp;⏭ Skipped: <strong>{enrollResult.skipped}</strong> (already enrolled)</>}
                </div>
              )}

              {error && <p style={{ color: 'red', marginBottom: '0.5rem' }}>{error}</p>}

              <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                  Academic Year:
                  <input value={academicYear} onChange={e => setAcademicYear(e.target.value)} style={{ width: '90px', padding: '0.25rem 0.5rem' }}/>
                </label>
                <label style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.875rem' }}>
                  Start Roll No:
                  <input type="number" min={1} value={startRoll} onChange={e => setStartRoll(e.target.value)} style={{ width: '70px', padding: '0.25rem 0.5rem' }}/>
                </label>
                <button className="outline-button compact" onClick={selectAll} style={{ marginLeft: 'auto' }}>Select All</button>
                <button className="outline-button compact" onClick={clearAll}>Clear</button>
              </div>

              {loadingStudents ? <p>Loading students…</p> : unenrolled.length === 0 ? (
                <p className="muted">All active students are already enrolled in this class.</p>
              ) : (
                <div style={{ maxHeight: '280px', overflowY: 'auto', border: '1px solid var(--border)', borderRadius: '8px' }}>
                  {unenrolled.map(s => (
                    <label
                      key={s.id}
                      style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', padding: '0.6rem 1rem', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
                    >
                      <input
                        type="checkbox"
                        checked={selected.has(s.id)}
                        onChange={() => toggleSelect(s.id)}
                      />
                      <span style={{ flex: 1 }}>{s.firstName} {s.lastName}</span>
                      <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>{s.studentId}</span>
                    </label>
                  ))}
                </div>
              )}

              {selected.size > 0 && (
                <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>{selected.size} student{selected.size !== 1 ? 's' : ''} selected</span>
                  <button className="primary-button" disabled={enrolling} onClick={handleEnroll}>
                    <UserPlus size={15}/>
                    {enrolling ? 'Enrolling…' : `Enroll ${selected.size} Student${selected.size !== 1 ? 's' : ''}`}
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </section>
    </div>
  )
}

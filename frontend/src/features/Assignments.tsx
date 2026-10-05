import { useEffect, useState } from 'react'
import { Plus, Search, UserCheck, X } from 'lucide-react'
import { getAllClassSubjects, assignTeacher } from '@/lib/api/subjects'
import { getTeachers, getMyTeacherProfile } from '@/lib/api/teachers'
import { useAuthStore } from '@/stores/auth-store'
import type { ClassSubject, Teacher } from '@/types/api'
import { ApiError } from '@/lib/api/client'

export default function Assignments() {
  const { user } = useAuthStore()
  const isAdvisor = user?.role === 'Class Advisor'

  const [classSubjects, setClassSubjects] = useState<ClassSubject[]>([])
  const [myTeacher, setMyTeacher]         = useState<Teacher | null>(null)
  const [loading, setLoading]             = useState(true)
  const [error, setError]                 = useState<string | null>(null)
  const [search, setSearch]               = useState('')
  const [showModal, setShowModal]         = useState(false)
  const [selected, setSelected]           = useState<ClassSubject | null>(null)
  const [selfAssigning, setSelfAssigning] = useState<ClassSubject | null>(null)

  function load() {
    setLoading(true)
    const requests: Promise<any>[] = [getAllClassSubjects({ isActive: true })]
    if (isAdvisor) requests.push(getMyTeacherProfile())

    Promise.all(requests)
      .then(([csRes, meRes]) => {
        setClassSubjects(csRes.classSubjects)
        if (meRes) setMyTeacher(meRes.teacher)
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  async function handleSelfAssign(cs: ClassSubject) {
    if (!myTeacher) return
    setSelfAssigning(cs)
    try {
      await assignTeacher(cs.id, myTeacher.id)
      load()
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Failed to self-assign')
    } finally { setSelfAssigning(null) }
  }

  const filtered = classSubjects.filter(cs =>
    cs.class.name.toLowerCase().includes(search.toLowerCase()) ||
    cs.subject.code.toLowerCase().includes(search.toLowerCase()) ||
    cs.subject.name.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Assignments</h1>
          <p>{isAdvisor ? 'Assign yourself or other teachers to class-subjects.' : 'Assign Class Advisors and Subject Teachers to class-subjects.'}</p>
        </div>
      </div>

      <div className="panel table-panel">
        <div className="toolbar">
          <div className="table-search">
            <Search size={15}/>
            <input placeholder="Search by class or subject…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
        </div>

        {loading ? <p style={{ padding: '1rem' }}>Loading…</p>
          : error ? <p style={{ color: 'red', padding: '1rem' }}>{error}</p>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr>
                    <th>#</th><th>Class</th><th>Subject</th><th>Academic Year</th><th>Status</th>
                    <th>{isAdvisor ? 'Self-Assign / Assign' : 'Assign'}</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((cs, i) => (
                    <tr key={cs.id}>
                      <td>{i + 1}</td>
                      <td>{cs.class.name}{cs.class.division ? ` (${cs.class.division})` : ''}</td>
                      <td>{cs.subject.code} — {cs.subject.name}</td>
                      <td>{cs.academicYear}</td>
                      <td><span className={`status ${cs.isActive ? 'active' : 'inactive'}`}>{cs.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td style={{ display: 'flex', gap: '0.25rem' }}>
                        {/* Self-assign button for Advisor */}
                        {isAdvisor && myTeacher && (
                          <button
                            className="row-action"
                            title="Assign myself to this subject"
                            disabled={selfAssigning?.id === cs.id}
                            onClick={() => handleSelfAssign(cs)}
                          >
                            <UserCheck size={14}/>
                          </button>
                        )}
                        {/* Assign any teacher button */}
                        <button
                          className="row-action"
                          title="Assign a teacher"
                          onClick={() => { setSelected(cs); setShowModal(true) }}
                        >
                          <Plus size={14}/>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        <div className="table-footer">
          <span>{filtered.length} class-subjects</span>
          {isAdvisor && myTeacher && (
            <span style={{ color: 'var(--muted)', fontSize: '0.8rem' }}>
              <UserCheck size={12}/> = assign yourself ({myTeacher.firstName} {myTeacher.lastName})
            </span>
          )}
        </div>
      </div>

      {showModal && selected && (
        <AssignTeacherModal
          classSubject={selected}
          onClose={() => { setShowModal(false); setSelected(null) }}
          onCreated={() => { setShowModal(false); setSelected(null); load() }}
        />
      )}
    </>
  )
}

function AssignTeacherModal({ classSubject, onClose, onCreated }: {
  classSubject: ClassSubject
  onClose: () => void
  onCreated: () => void
}) {
  const [teachers, setTeachers]   = useState<Teacher[]>([])
  const [teacherId, setTeacherId] = useState<number>(0)
  const [saving, setSaving]       = useState(false)
  const [error, setError]         = useState<string | null>(null)
  const [done, setDone]           = useState(false)

  useEffect(() => {
    getTeachers()
      .then(r => {
        setTeachers(r.teachers)
        if (r.teachers.length > 0) setTeacherId(r.teachers[0].id)
      })
      .catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await assignTeacher(classSubject.id, teacherId)
      setDone(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to assign teacher')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal>
        <div className="modal-header">
          <div><p className="eyebrow">ASSIGNMENT</p><h2>Assign Teacher / Advisor</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>
        <p style={{ padding: '0 1.5rem', color: 'var(--muted)' }}>
          {classSubject.class.name} · {classSubject.subject.name} · {classSubject.academicYear}
        </p>
        {done ? (
          <div className="modal-success"><h3>Teacher assigned</h3><button className="primary-button" onClick={onCreated}>Done</button></div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'red', padding: '0 1.5rem' }}>{error}</p>}
            <div className="modal-fields">
              <label>Teacher
                <select value={teacherId} onChange={e => setTeacherId(Number(e.target.value))}>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>
                      {t.fullName} ({t.employeeId}) — {t.user.role.name}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="outline-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving || teachers.length === 0}>
                {saving ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

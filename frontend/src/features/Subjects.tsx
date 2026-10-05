import { useEffect, useState } from 'react'
import { BookOpen, Plus, Search, X } from 'lucide-react'
import { getSubjects, createSubject, getAllClassSubjects } from '@/lib/api/subjects'
import { getMyTeacherProfile, getTeacherAssignments } from '@/lib/api/teachers'
import { getClasses } from '@/lib/api/classes'
import { useAuthStore } from '@/stores/auth-store'
import type { Subject } from '@/types/api'
import { ApiError } from '@/lib/api/client'

export default function Subjects() {
  const { user } = useAuthStore()
  const isAdmin   = user?.role === 'Administrator'
  const isAdvisor = user?.role === 'Class Advisor'
  const isTeacher = user?.role === 'Subject Teacher'

  const [subjects, setSubjects] = useState<Subject[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [showModal, setShowModal] = useState(false)

  useEffect(() => {
    setLoading(true)

    if (isAdmin) {
      // Admin sees all subjects
      getSubjects()
        .then(r => setSubjects(r.subjects))
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))

    } else if (isAdvisor) {
      // Advisor sees only subjects linked to their class
      Promise.all([getMyTeacherProfile(), getAllClassSubjects({ isActive: true })])
        .then(([meRes, csRes]) => {
          const myTeacherId = meRes.teacher.id
          // Find their class (where they are the advisor)
          getClasses()
            .then(classRes => {
              const myClass = classRes.classes.find(c => c.advisorId === myTeacherId)
              if (!myClass) { setSubjects([]); return }
              // Filter class-subjects to their class only
              const myClassSubjects = csRes.classSubjects.filter(cs => cs.classId === myClass.id)
              // Deduplicate subjects
              const seen = new Set<number>()
              const filtered: Subject[] = []
              for (const cs of myClassSubjects) {
                if (!seen.has(cs.subject.id)) {
                  seen.add(cs.subject.id)
                  filtered.push(cs.subject)
                }
              }
              setSubjects(filtered)
            })
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))

    } else if (isTeacher) {
      // Subject Teacher sees only subjects they are assigned to teach
      Promise.all([getMyTeacherProfile(), getAllClassSubjects({ isActive: true })])
        .then(([meRes, csRes]) => {
          const myTeacherId = meRes.teacher.id
          getTeacherAssignments(myTeacherId)
            .then(res => {
              const assignedCsIds = new Set(res.assignments.map(a => a.classSubjectId))
              const seen = new Set<number>()
              const filtered: Subject[] = []
              for (const cs of csRes.classSubjects) {
                if (assignedCsIds.has(cs.id) && !seen.has(cs.subject.id)) {
                  seen.add(cs.subject.id)
                  filtered.push(cs.subject)
                }
              }
              setSubjects(filtered)
            })
        })
        .catch(e => setError(e.message))
        .finally(() => setLoading(false))
    }
  }, [isAdmin, isAdvisor, isTeacher])

  const colors = ['blue', 'purple', 'red', 'orange', 'green', 'amber']
  const filtered = subjects.filter(s =>
    s.name.toLowerCase().includes(search.toLowerCase()) ||
    s.code.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="page-heading">
        <div>
          <h1>Subjects</h1>
          <p>
            {isAdvisor ? 'Subjects linked to your class.' :
             isTeacher ? 'Subjects you are assigned to teach.' :
             'Manage subjects offered across the institution.'}
          </p>
        </div>
      </div>

      <div className="cards-toolbar">
        <div className="table-search">
          <Search size={15}/>
          <input placeholder="Search subjects…" value={search} onChange={e => setSearch(e.target.value)}/>
        </div>
        {/* Admin and Advisor can create subjects */}
        {(isAdmin || isAdvisor) && (
          <button className="primary-button compact" onClick={() => setShowModal(true)}>
            <Plus size={15}/> Add Subject
          </button>
        )}
      </div>

      {loading ? <p style={{ padding: '1rem' }}>Loading…</p>
        : error ? <p style={{ color: 'red', padding: '1rem' }}>{error}</p>
        : (
          <div className="cards-grid">
            {filtered.map((s, i) => (
              <div className="class-card" key={s.id}>
                <div className={`class-icon ${colors[i % colors.length]}`}><BookOpen size={18}/></div>
                <h3>{s.name}</h3>
                <p>{s.code}</p>
              </div>
            ))}
            {filtered.length === 0 && (
              <p className="muted">
                {isAdvisor ? 'No subjects linked to your class yet. Add a subject then link it from the Classes screen.' :
                 isTeacher ? 'No subjects assigned to you yet.' :
                 'No subjects found.'}
              </p>
            )}
          </div>
        )
      }

      {showModal && (
        <AddSubjectModal
          onClose={() => setShowModal(false)}
          onCreated={() => { setShowModal(false) }}
        />
      )}
    </>
  )
}

function AddSubjectModal({ onClose, onCreated }: { onClose: () => void; onCreated: () => void }) {
  const [form, setForm]     = useState({ name: '', code: '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [done, setDone]     = useState(false)

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      await createSubject({ name: form.name, code: form.code.toUpperCase() })
      setDone(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to create subject')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal>
        <div className="modal-header">
          <div><p className="eyebrow">SUBJECT MANAGEMENT</p><h2>Add Subject</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>
        {done ? (
          <div className="modal-success">
            <h3>Subject created</h3>
            <p style={{ fontSize: '0.875rem', color: 'var(--muted)' }}>
              Next: go to <strong>Classes</strong> → your class → <strong>Link Subject</strong> to assign this subject to your class.
            </p>
            <button className="primary-button" onClick={onCreated}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'red', padding: '0 1.5rem' }}>{error}</p>}
            <div className="modal-fields">
              <label>Subject Name<input required value={form.name} onChange={e => set('name', e.target.value)} placeholder="e.g. Data Structures"/></label>
              <label>Subject Code (uppercase)<input required value={form.code} onChange={e => set('code', e.target.value.toUpperCase())} placeholder="e.g. CS301"/></label>
            </div>
            <div className="modal-footer">
              <button type="button" className="outline-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Creating…' : 'Create Subject'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

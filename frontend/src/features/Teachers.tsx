import { useEffect, useState } from 'react'
import { Pencil, Plus, Search, X } from 'lucide-react'
import { getTeachers, createTeacher, updateTeacher } from '@/lib/api/teachers'
import { getUsers } from '@/lib/api/users'
import type { Teacher, User } from '@/types/api'
import { ApiError } from '@/lib/api/client'

export default function Teachers() {
  const [teachers, setTeachers] = useState<Teacher[]>([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState<string | null>(null)
  const [search, setSearch]     = useState('')
  const [showAdd, setShowAdd]   = useState(false)
  const [editing, setEditing]   = useState<Teacher | null>(null)

  function load() {
    setLoading(true)
    getTeachers()
      .then(r => setTeachers(r.teachers))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = teachers.filter(t =>
    t.fullName.toLowerCase().includes(search.toLowerCase()) ||
    t.employeeId.toLowerCase().includes(search.toLowerCase())
  )

  return (
    <>
      <div className="page-heading">
        <div><h1>Teachers</h1><p>Manage teacher profiles and their assignments.</p></div>
      </div>

      <div className="panel table-panel">
        <div className="toolbar">
          <div className="table-search">
            <Search size={15}/>
            <input placeholder="Search by name or employee ID…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <button className="primary-button compact" onClick={() => setShowAdd(true)}>
            <Plus size={15}/> Add Teacher
          </button>
        </div>

        {loading ? <p style={{ padding: '1rem' }}>Loading…</p>
          : error ? <p style={{ padding: '1rem', color: 'red' }}>{error}</p>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Name</th><th>Employee ID</th><th>Department</th><th>Username</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map((t, i) => (
                    <tr key={t.id}>
                      <td>{i + 1}</td>
                      <td>
                        <span className="name-cell">
                          <span className="mini-avatar">{t.firstName[0]}</span>
                          {t.fullName}
                        </span>
                      </td>
                      <td>{t.employeeId}</td>
                      <td>{t.department ?? '—'}</td>
                      <td>{t.user.username}</td>
                      <td>
                        <span className={`status ${t.user.isActive ? 'active' : 'inactive'}`}>
                          {t.user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td>
                        <button className="row-action" title="Edit" onClick={() => setEditing(t)}>
                          <Pencil size={13}/>
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
          <span>Showing {filtered.length} of {teachers.length} teachers</span>
        </div>
      </div>

      {showAdd && (
        <TeacherModal
          mode="add"
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load() }}
        />
      )}

      {editing && (
        <TeacherModal
          mode="edit"
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </>
  )
}

// ── Add / Edit Teacher modal ──────────────────────────────────────────────────

function TeacherModal({
  mode, initial, onClose, onSaved,
}: {
  mode: 'add' | 'edit'
  initial?: Teacher
  onClose: () => void
  onSaved: () => void
}) {
  const [users, setUsers]   = useState<User[]>([])
  const [form, setForm]     = useState({
    userId:     initial?.userId     ?? 0,
    firstName:  initial?.firstName  ?? '',
    lastName:   initial?.lastName   ?? '',
    employeeId: initial?.employeeId ?? '',
    department: initial?.department ?? '',
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [done, setDone]     = useState(false)

  useEffect(() => {
    if (mode === 'add') {
      getUsers({ isActive: true })
        .then(r => {
          const eligible = r.users.filter(u => u.role === 'Subject Teacher' || u.role === 'Class Advisor')
          setUsers(eligible)
          if (eligible.length > 0) setForm(f => ({ ...f, userId: eligible[0].id }))
        })
        .catch(() => {})
    }
  }, [mode])

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      if (mode === 'add') {
        await createTeacher({
          userId:     Number(form.userId),
          firstName:  form.firstName,
          lastName:   form.lastName,
          employeeId: form.employeeId,
          department: form.department || undefined,
        })
      } else {
        await updateTeacher(initial!.id, {
          firstName:  form.firstName,
          lastName:   form.lastName,
          employeeId: form.employeeId,
          department: form.department || undefined,
        })
      }
      setDone(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to save teacher')
    } finally { setSaving(false) }
  }

  const title = mode === 'add' ? 'Add Teacher' : 'Edit Teacher'

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal>
        <div className="modal-header">
          <div><p className="eyebrow">TEACHER MANAGEMENT</p><h2>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>
        {done ? (
          <div className="modal-success">
            <h3>{mode === 'add' ? 'Teacher created' : 'Teacher updated'}</h3>
            <button className="primary-button" onClick={onSaved}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'red', padding: '0 1.5rem' }}>{error}</p>}
            <div className="modal-fields">
              {mode === 'add' && (
                <label>User Account
                  <select value={form.userId} onChange={e => set('userId', Number(e.target.value))}>
                    {users.map(u => <option key={u.id} value={u.id}>{u.username} ({u.role})</option>)}
                  </select>
                </label>
              )}
              {mode === 'edit' && (
                <label>Linked Account
                  <input disabled value={initial?.user.username ?? ''}/>
                </label>
              )}
              <label>First Name
                <input required value={form.firstName} onChange={e => set('firstName', e.target.value)}/>
              </label>
              <label>Last Name
                <input required value={form.lastName} onChange={e => set('lastName', e.target.value)}/>
              </label>
              <label>Employee ID
                <input required value={form.employeeId} onChange={e => set('employeeId', e.target.value)}/>
              </label>
              <label>Department (optional)
                <input value={form.department} onChange={e => set('department', e.target.value)}/>
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="outline-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving || (mode === 'add' && users.length === 0)}>
                {saving ? 'Saving…' : mode === 'add' ? 'Create Teacher' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

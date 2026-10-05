import { useEffect, useRef, useState } from 'react'
import { Pencil, Plus, Search, Upload, UserPlus, X } from 'lucide-react'
import { getStudents, createStudent, updateStudent, deactivateStudent, importStudents } from '@/lib/api/students'
import type { ImportRow, ImportResult } from '@/lib/api/students'
import { getClasses, enrollStudent } from '@/lib/api/classes'
import type { DasClass, Student } from '@/types/api'
import { ApiError } from '@/lib/api/client'
import { useAuthStore } from '@/stores/auth-store'

export default function Students() {
  const { user } = useAuthStore()
  const [students, setStudents]     = useState<Student[]>([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState<string | null>(null)
  const [search, setSearch]         = useState('')
  const [showAdd, setShowAdd]       = useState(false)
  const [showImport, setShowImport] = useState(false)
  const [editing, setEditing]       = useState<Student | null>(null)
  const [enrolling, setEnrolling]   = useState<Student | null>(null)

  function load() {
    setLoading(true)
    getStudents()
      .then(r => setStudents(r.students))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = students.filter(s =>
    s.fullName.toLowerCase().includes(search.toLowerCase()) ||
    s.studentId.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDeactivate(id: number) {
    if (!confirm('Deactivate this student?')) return
    try { await deactivateStudent(id); load() }
    catch (e) { alert(e instanceof ApiError ? e.message : 'Failed to deactivate') }
  }

  const isAdmin = user?.role === 'Administrator'

  return (
    <>
      <div className="page-heading">
        <div><h1>Students</h1><p>Manage student records and class enrollments.</p></div>
      </div>

      <div className="panel table-panel">
        <div className="toolbar">
          <div className="table-search">
            <Search size={15}/>
            <input placeholder="Search by name or student ID…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <button className="outline-button compact" onClick={() => setShowImport(true)} style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
            <Upload size={15}/> Import CSV
          </button>
          <button className="primary-button compact" onClick={() => setShowAdd(true)}>
            <Plus size={15}/> Add Student
          </button>
        </div>

        {loading ? <p style={{ padding: '1rem' }}>Loading…</p>
          : error ? <p style={{ padding: '1rem', color: 'red' }}>{error}</p>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Name</th><th>Student ID</th><th>Email</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map((s, i) => (
                    <tr key={s.id}>
                      <td>{i + 1}</td>
                      <td>
                        <span className="name-cell">
                          <span className="mini-avatar">{s.firstName[0]}</span>
                          {s.fullName}
                        </span>
                      </td>
                      <td>{s.studentId}</td>
                      <td>{s.email ?? '—'}</td>
                      <td><span className={`status ${s.isActive ? 'active' : 'inactive'}`}>{s.isActive ? 'Active' : 'Inactive'}</span></td>
                      <td style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="row-action" title="Edit" onClick={() => setEditing(s)}><Pencil size={13}/></button>
                        {s.isActive && (
                          <button className="row-action" title="Enroll in class" onClick={() => setEnrolling(s)}><UserPlus size={13}/></button>
                        )}
                        {s.isActive && isAdmin && (
                          <button className="row-action danger" title="Deactivate" onClick={() => handleDeactivate(s.id)}><X size={13}/></button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }
        <div className="table-footer">
          <span>Showing {filtered.length} of {students.length} students</span>
        </div>
      </div>

      {showAdd && <StudentModal mode="add" onClose={() => setShowAdd(false)} onSaved={() => { setShowAdd(false); load() }} />}
      {editing && <StudentModal mode="edit" initial={editing} onClose={() => setEditing(null)} onSaved={() => { setEditing(null); load() }} />}
      {enrolling && <EnrollModal student={enrolling} onClose={() => setEnrolling(null)} onSaved={() => { setEnrolling(null) }} />}
      {showImport && <ImportModal onClose={() => setShowImport(false)} onImported={() => { setShowImport(false); load() }} />}
    </>
  )
}

// ── Add / Edit Student modal ──────────────────────────────────────────────────

function StudentModal({ mode, initial, onClose, onSaved }: { mode: 'add' | 'edit'; initial?: Student; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({ firstName: initial?.firstName ?? '', lastName: initial?.lastName ?? '', studentId: initial?.studentId ?? '', email: initial?.email ?? '' })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [done, setDone]     = useState(false)

  function set(field: string, value: string) { setForm(f => ({ ...f, [field]: value })) }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); setSaving(true); setError(null)
    try {
      if (mode === 'add') await createStudent({ firstName: form.firstName, lastName: form.lastName, studentId: form.studentId, email: form.email || undefined })
      else await updateStudent(initial!.id, { firstName: form.firstName, lastName: form.lastName, studentId: form.studentId, email: form.email || null })
      setDone(true)
    } catch (e) { setError(e instanceof ApiError ? e.message : 'Failed to save student') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal>
        <div className="modal-header">
          <div><p className="eyebrow">STUDENT MANAGEMENT</p><h2>{mode === 'add' ? 'Add Student' : 'Edit Student'}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>
        {done ? (
          <div className="modal-success"><h3>{mode === 'add' ? 'Student added' : 'Student updated'}</h3><button className="primary-button" onClick={onSaved}>Done</button></div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'red', padding: '0 1.5rem' }}>{error}</p>}
            <div className="modal-fields">
              <label>First Name<input required value={form.firstName} onChange={e => set('firstName', e.target.value)}/></label>
              <label>Last Name<input required value={form.lastName} onChange={e => set('lastName', e.target.value)}/></label>
              <label>Student ID<input required value={form.studentId} onChange={e => set('studentId', e.target.value)}/></label>
              <label>Email (optional)<input type="email" value={form.email} onChange={e => set('email', e.target.value)}/></label>
            </div>
            <div className="modal-footer">
              <button type="button" className="outline-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving}>{saving ? 'Saving…' : mode === 'add' ? 'Add Student' : 'Save Changes'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

// ── Enroll Student in Class modal ─────────────────────────────────────────────

function EnrollModal({ student, onClose, onSaved }: { student: Student; onClose: () => void; onSaved: () => void }) {
  const [classes, setClasses]       = useState<DasClass[]>([])
  const [classId, setClassId]       = useState<number>(0)
  const [academicYear, setYear]     = useState('2025-26')
  const [rollNumber, setRollNumber] = useState('')
  const [saving, setSaving]         = useState(false)
  const [error, setError]           = useState<string | null>(null)
  const [done, setDone]             = useState(false)

  useEffect(() => {
    getClasses({ isActive: true }).then(r => {
      setClasses(r.classes)
      if (r.classes.length > 0) { setClassId(r.classes[0].id); setYear(r.classes[0].academicYear) }
    }).catch(() => {})
  }, [])

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault(); if (!classId || !rollNumber) return
    setSaving(true); setError(null)
    try { await enrollStudent(classId, { studentId: student.id, academicYear, rollNumber }); setDone(true) }
    catch (e) { setError(e instanceof ApiError ? e.message : 'Failed to enroll student') }
    finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal>
        <div className="modal-header">
          <div><p className="eyebrow">ENROLLMENT</p><h2>Enroll {student.firstName} {student.lastName}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>
        {done ? (
          <div className="modal-success"><h3>Student enrolled</h3><button className="primary-button" onClick={onSaved}>Done</button></div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'red', padding: '0 1.5rem' }}>{error}</p>}
            <div className="modal-fields">
              <label>Class
                <select value={classId} onChange={e => { const id = Number(e.target.value); setClassId(id); const f = classes.find(c => c.id === id); if (f) setYear(f.academicYear) }}>
                  {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.academicYear})</option>)}
                </select>
              </label>
              <label>Academic Year<input required value={academicYear} onChange={e => setYear(e.target.value)}/></label>
              <label>Roll Number<input required value={rollNumber} onChange={e => setRollNumber(e.target.value)} placeholder="e.g. 1"/></label>
            </div>
            <div className="modal-footer">
              <button type="button" className="outline-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving || classes.length === 0}>{saving ? 'Enrolling…' : 'Enroll Student'}</button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

// ── CSV / Excel Import modal ──────────────────────────────────────────────────

function ImportModal({ onClose, onImported }: { onClose: () => void; onImported: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [rows, setRows]         = useState<ImportRow[]>([])
  const [fileName, setFileName] = useState('')
  const [parseError, setParseError] = useState<string | null>(null)
  const [result, setResult]     = useState<ImportResult | null>(null)
  const [saving, setSaving]     = useState(false)
  const [error, setError]       = useState<string | null>(null)

  function parseCSV(text: string): ImportRow[] {
    const lines = text.trim().split(/\r?\n/)
    if (lines.length < 2) throw new Error('File must have a header row and at least one data row')

    // Normalize header: lowercase, trim, remove BOM
    const headers = lines[0].replace(/^\uFEFF/, '').split(',').map(h => h.trim().toLowerCase())

    const firstIdx  = headers.indexOf('firstname')  !== -1 ? headers.indexOf('firstname')  : headers.indexOf('first_name')
    const lastIdx   = headers.indexOf('lastname')   !== -1 ? headers.indexOf('lastname')   : headers.indexOf('last_name')
    const sidIdx    = headers.indexOf('studentid')  !== -1 ? headers.indexOf('studentid')  : headers.indexOf('student_id')
    const emailIdx  = headers.indexOf('email')

    if (firstIdx === -1 || lastIdx === -1 || sidIdx === -1) {
      throw new Error('CSV must have columns: firstName, lastName, studentId (and optionally email)')
    }

    return lines.slice(1).filter(l => l.trim()).map(line => {
      const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''))
      return {
        firstName: cols[firstIdx]  ?? '',
        lastName:  cols[lastIdx]   ?? '',
        studentId: cols[sidIdx]    ?? '',
        email:     emailIdx !== -1 ? (cols[emailIdx] || undefined) : undefined,
      }
    })
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0]
    if (!file) return
    setFileName(file.name); setParseError(null); setRows([]); setResult(null)

    const reader = new FileReader()
    reader.onload = ev => {
      try {
        const text = ev.target?.result as string
        const parsed = parseCSV(text)
        setRows(parsed)
      } catch (err: any) {
        setParseError(err.message)
      }
    }
    reader.readAsText(file)
  }

  async function handleImport() {
    if (rows.length === 0) return
    setSaving(true); setError(null)
    try {
      const res = await importStudents(rows)
      setResult(res)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Import failed')
    } finally { setSaving(false) }
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal style={{ maxWidth: '540px' }}>
        <div className="modal-header">
          <div><p className="eyebrow">IMPORT</p><h2>Import Students from CSV</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>

        {result ? (
          <div style={{ padding: '1.5rem' }}>
            <h3 style={{ marginBottom: '0.75rem' }}>Import complete</h3>
            <p>✅ Created: <strong>{result.created.length}</strong></p>
            <p>⏭ Skipped: <strong>{result.skipped.length}</strong> {result.skipped.length > 0 && `(${result.skipped.slice(0,3).map(s => s.studentId).join(', ')}${result.skipped.length > 3 ? '…' : ''})`}</p>
            <p>❌ Errors: <strong>{result.errors.length}</strong></p>
            <div className="modal-footer" style={{ marginTop: '1rem' }}>
              <button className="outline-button" onClick={onClose}>Close</button>
              <button className="primary-button" onClick={onImported}>Done</button>
            </div>
          </div>
        ) : (
          <div style={{ padding: '1.5rem' }}>
            <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Upload a CSV file with columns: <code>firstName, lastName, studentId, email</code> (email optional).<br/>
              First row must be the header. Max 500 rows per import.
            </p>

            <div
              style={{ border: '2px dashed var(--border)', borderRadius: '8px', padding: '1.5rem', textAlign: 'center', cursor: 'pointer', marginBottom: '1rem' }}
              onClick={() => fileRef.current?.click()}
            >
              <Upload size={24} style={{ marginBottom: '0.5rem', opacity: 0.5 }}/>
              <p>{fileName || 'Click to select a CSV file'}</p>
              <input ref={fileRef} type="file" accept=".csv,.txt" style={{ display: 'none' }} onChange={handleFile}/>
            </div>

            {parseError && <p style={{ color: 'red', marginBottom: '0.5rem' }}>{parseError}</p>}
            {error      && <p style={{ color: 'red', marginBottom: '0.5rem' }}>{error}</p>}

            {rows.length > 0 && (
              <p style={{ color: 'var(--muted)', marginBottom: '1rem', fontSize: '0.875rem' }}>
                {rows.length} student{rows.length !== 1 ? 's' : ''} ready to import
              </p>
            )}

            <div className="modal-footer">
              <button type="button" className="outline-button" onClick={onClose}>Cancel</button>
              <button
                className="primary-button"
                disabled={rows.length === 0 || saving}
                onClick={handleImport}
              >
                {saving ? 'Importing…' : `Import ${rows.length > 0 ? rows.length + ' students' : ''}`}
              </button>
            </div>
          </div>
        )}
      </section>
    </div>
  )
}

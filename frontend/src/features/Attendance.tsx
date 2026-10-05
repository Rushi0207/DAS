import { useEffect, useState } from 'react'
import { ArrowUpRight, CalendarCheck, CheckCircle2, Clock3, Edit2, History, Users, X } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { getClasses, getClassSubjects, getClassEnrollments } from '@/lib/api/classes'
import { createSession, submitAttendance, getSessions, getSessionRecords, updateAttendanceRecord } from '@/lib/api/attendance'
import type { DasClass, ClassSubject, Enrollment, AttendanceSession, AttendanceSubmitResult } from '@/types/api'
import { ApiError } from '@/lib/api/client'
import { useAttendanceStore } from '@/stores/attendance-store'
import { routePaths } from '@/app/routes'

type RecordRow = { id: number; studentId: number; status: string; student: { id: number; firstName: string; lastName: string; studentId: string } }

export default function Attendance() {
  const navigate = useNavigate()
  const [tab, setTab] = useState<'mark' | 'history'>('mark')

  return (
    <>
      <div className="page-heading">
        <div><h1>Attendance</h1><p>Mark attendance or review previous sessions.</p></div>
        <button className="outline-button" onClick={() => navigate(routePaths.Reports)}>
          Reports <ArrowUpRight size={15}/>
        </button>
      </div>

      <div style={{ display: 'flex', borderBottom: '1px solid var(--border)', marginBottom: '1.5rem' }}>
        {(['mark', 'history'] as const).map(t => (
          <button
            key={t}
            onClick={() => setTab(t)}
            style={{
              padding: '0.6rem 1.25rem',
              border: 'none',
              borderBottom: tab === t ? '2px solid var(--primary)' : '2px solid transparent',
              background: 'none',
              cursor: 'pointer',
              fontWeight: tab === t ? 600 : 400,
              color: tab === t ? 'var(--primary)' : 'var(--muted)',
              display: 'flex', alignItems: 'center', gap: '0.4rem',
            }}
          >
            {t === 'mark' ? <><CalendarCheck size={15}/> Mark Attendance</> : <><History size={15}/> Past Sessions</>}
          </button>
        ))}
      </div>

      {tab === 'mark' ? <MarkAttendanceTab/> : <HistoryTab/>}
    </>
  )
}

// ── Mark Attendance Tab ───────────────────────────────────────────────────────

function MarkAttendanceTab() {
  const [step, setStep] = useState<'setup' | 'started' | 'submitted'>('setup')

  const [classes, setClasses]               = useState<DasClass[]>([])
  const [classSubjects, setClassSubjects]   = useState<ClassSubject[]>([])
  const [enrollments, setEnrollments]       = useState<Enrollment[]>([])
  const [selectedClassId, setSelectedClassId] = useState<number>(0)
  const [selectedCsId, setSelectedCsId]       = useState<number>(0)
  const [sessionDate, setSessionDate]         = useState(new Date().toISOString().slice(0, 10))
  const [startTime, setStartTime]             = useState('')
  const [starting, setStarting]               = useState(false)
  const [setupError, setSetupError]           = useState<string | null>(null)
  const [showRollInput, setShowRollInput]     = useState(false)

  const { sessionId, selectedStudentIds, setSessionId, toggleStudent, markAllPresent, clearAll, reset } = useAttendanceStore()
  const [result, setResult]         = useState<AttendanceSubmitResult | null>(null)
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  useEffect(() => {
    getClasses({ isActive: true }).then(r => {
      setClasses(r.classes)
      if (r.classes.length > 0) setSelectedClassId(r.classes[0].id)
    }).catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedClassId) return
    getClassSubjects(selectedClassId, { isActive: true }).then(r => {
      setClassSubjects(r.classSubjects)
      setSelectedCsId(r.classSubjects.length > 0 ? r.classSubjects[0].id : 0)
    }).catch(() => {})
  }, [selectedClassId])

  useEffect(() => {
    if (!selectedClassId || !selectedCsId) return
    const cs = classSubjects.find(c => c.id === selectedCsId)
    if (!cs) return
    getClassEnrollments(selectedClassId, { academicYear: cs.academicYear, isActive: true })
      .then(r => setEnrollments(r.enrollments)).catch(() => {})
  }, [selectedCsId, selectedClassId, classSubjects])

  async function handleStart(e: React.FormEvent) {
    e.preventDefault()
    if (!selectedCsId) return
    setStarting(true); setSetupError(null)
    try {
      const res = await createSession({ classSubjectId: selectedCsId, sessionDate, startTime: startTime || undefined })
      setSessionId(res.session.id)
      setStep('started')
    } catch (e) {
      setSetupError(e instanceof ApiError ? e.message : 'Failed to create session')
    } finally { setStarting(false) }
  }

  async function handleSubmit() {
    if (!sessionId) return
    setSubmitting(true); setSubmitError(null)
    try {
      const res = await submitAttendance(sessionId, selectedStudentIds)
      setResult(res); setStep('submitted'); reset()
    } catch (e) {
      setSubmitError(e instanceof ApiError ? e.message : 'Failed to submit')
    } finally { setSubmitting(false) }
  }

  const selectedCs = classSubjects.find(c => c.id === selectedCsId)

  if (step === 'submitted' && result) {
    return (
      <section className="panel attendance-success">
        <div className="success-icon"><CheckCircle2 size={34}/></div>
        <h2>Attendance submitted</h2>
        <p>{result.class.name} · {result.subject.name} · {new Date(result.sessionDate).toLocaleDateString()}</p>
        <div className="success-metrics">
          <div><strong>{result.totalEnrolled}</strong><span>Total</span></div>
          <div><strong>{result.totalPresent}</strong><span>Present</span></div>
          <div><strong>{result.totalAbsent}</strong><span>Absent</span></div>
          <div><strong>{result.totalEnrolled > 0 ? Math.round((result.totalPresent / result.totalEnrolled) * 100) : 0}%</strong><span>Rate</span></div>
        </div>
        <div className="success-actions">
          <button className="primary-button" onClick={() => { setStep('setup'); setResult(null) }}>
            Mark Another Session
          </button>
        </div>
      </section>
    )
  }

  return (
    <>
      <div className="attendance-layout">
        <section className="panel attendance-form">
          <div className="form-title">
            <div className="step-number">01</div>
            <div><h3>Session details</h3><p>Select class, subject and date.</p></div>
          </div>
          <form onSubmit={handleStart}>
            {setupError && <p style={{ color: 'red', marginBottom: '0.5rem' }}>{setupError}</p>}
            <label>Class
              <select value={selectedClassId} onChange={e => setSelectedClassId(Number(e.target.value))} disabled={step === 'started'}>
                {classes.map(c => <option key={c.id} value={c.id}>{c.name} ({c.academicYear})</option>)}
              </select>
            </label>
            <label>Subject
              <select value={selectedCsId} onChange={e => setSelectedCsId(Number(e.target.value))} disabled={step === 'started'}>
                {classSubjects.length === 0
                  ? <option value={0}>No subjects linked</option>
                  : classSubjects.map(cs => <option key={cs.id} value={cs.id}>{cs.subject.code} — {cs.subject.name}</option>)
                }
              </select>
            </label>
            <label>Date<input type="date" value={sessionDate} onChange={e => setSessionDate(e.target.value)} disabled={step === 'started'} required/></label>
            <label>Start Time (optional)<input type="time" value={startTime} onChange={e => setStartTime(e.target.value)} disabled={step === 'started'}/></label>
            {step === 'setup' && (
              <button type="submit" className="primary-button full" disabled={starting || !selectedCsId}>
                {starting ? 'Starting…' : 'Start Attendance'} <ArrowUpRight size={16}/>
              </button>
            )}
          </form>
        </section>

        <section className="panel attendance-preview">
          <div className="panel-heading">
            <div>
              <h3>{step === 'started' ? 'Student Roster' : "Today's Overview"}</h3>
              <span>{selectedCs ? `${selectedCs.class.name} · ${selectedCs.subject.name}` : '—'}</span>
            </div>
            <span className={`status ${step === 'started' ? 'active' : 'pending'}`}>
              {step === 'started' ? 'In progress' : 'Ready'}
            </span>
          </div>

          <div className="attendance-summary">
            <div><Users size={18}/><strong>{enrollments.length}</strong><span>Enrolled</span></div>
            <div><CheckCircle2 size={18}/><strong>{selectedStudentIds.length}</strong><span>Present</span></div>
            <div><X size={18}/><strong>{enrollments.length - selectedStudentIds.length}</strong><span>Absent</span></div>
          </div>

          {step === 'started' ? (
            <div className="roster">
              <div className="roster-heading">
                <strong>Mark present students</strong>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="text-button" onClick={() => setShowRollInput(true)}>
                    Enter roll nos.
                  </button>
                  <button className="text-button" onClick={() => markAllPresent(enrollments.map(e => e.student.id))}>
                    All present
                  </button>
                  <button className="text-button" onClick={() => clearAll()}>
                    Clear
                  </button>
                </div>
              </div>

              {enrollments.map(enrollment => {
                const sid = enrollment.student.id
                const isPresent = selectedStudentIds.includes(sid)
                return (
                  <div className="roster-row" key={enrollment.id}>
                    <span className="mini-avatar">{enrollment.student.firstName[0]}</span>
                    <div>
                      <strong>{enrollment.student.firstName} {enrollment.student.lastName}</strong>
                      <small>{enrollment.student.studentId} · Roll {enrollment.rollNumber}</small>
                    </div>
                    <button
                      className={`attendance-toggle ${isPresent ? 'is-present' : 'is-absent'}`}
                      onClick={() => toggleStudent(sid)}
                    >
                      {isPresent ? <><CheckCircle2 size={14}/> Present</> : <><X size={14}/> Absent</>}
                    </button>
                  </div>
                )
              })}

              {submitError && <p style={{ color: 'red', margin: '0.5rem 0' }}>{submitError}</p>}
              <button className="primary-button full" onClick={handleSubmit} disabled={submitting} style={{ marginTop: '1rem' }}>
                {submitting ? 'Submitting…' : 'Submit Attendance'} <CheckCircle2 size={16}/>
              </button>
            </div>
          ) : (
            <div className="attendance-note">
              <Clock3 size={18}/>
              <p><strong>Tip:</strong> Select a class and subject, then press Start. You can enter roll numbers directly or toggle students individually.</p>
            </div>
          )}
        </section>
      </div>

      {step === 'started' && (
        <div className="toast">
          <CheckCircle2 size={17}/> Session started — mark present students then submit
        </div>
      )}

      {showRollInput && (
        <RollNumberPopup
          enrollments={enrollments}
          onApply={(ids) => {
            clearAll()
            ids.forEach(id => toggleStudent(id))
            setShowRollInput(false)
          }}
          onClose={() => setShowRollInput(false)}
        />
      )}
    </>
  )
}

// ── Roll Number Quick Entry Popup ─────────────────────────────────────────────

function RollNumberPopup({
  enrollments, onApply, onClose,
}: {
  enrollments: Enrollment[]
  onApply: (studentIds: number[]) => void
  onClose: () => void
}) {
  const [input, setInput]     = useState('')
  const [error, setError]     = useState<string | null>(null)
  const [preview, setPreview] = useState<{ found: string[]; notFound: string[] } | null>(null)

  // Build roll → studentId map
  const rollMap = new Map<string, number>()
  for (const e of enrollments) {
    rollMap.set(e.rollNumber.trim(), e.student.id)
  }

  function handlePreview() {
    setError(null)
    const raw = input.trim()
    if (!raw) { setError('Enter at least one roll number'); return }
    const rolls = raw.split(/[\s,]+/).filter(Boolean)
    const found: string[] = []
    const notFound: string[] = []
    for (const r of rolls) {
      rollMap.has(r) ? found.push(r) : notFound.push(r)
    }
    setPreview({ found, notFound })
  }

  function handleApply() {
    if (!preview) return
    const ids = preview.found.map(r => rollMap.get(r)!).filter(Boolean)
    onApply(ids)
  }

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal style={{ maxWidth: '440px' }}>
        <div className="modal-header">
          <div><p className="eyebrow">QUICK ENTRY</p><h2>Enter Present Roll Numbers</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>

        <div style={{ padding: '1.25rem 1.5rem' }}>
          <p style={{ color: 'var(--muted)', fontSize: '0.875rem', marginBottom: '0.75rem' }}>
            Type roll numbers separated by spaces or commas. Example: <code>1 3 5 7 8</code>
          </p>

          <textarea
            autoFocus
            value={input}
            onChange={e => { setInput(e.target.value); setPreview(null); setError(null) }}
            placeholder="e.g.  1 2 4 7 8 12 15"
            style={{ width: '100%', minHeight: '80px', padding: '0.5rem', borderRadius: '6px', border: '1px solid var(--border)', fontFamily: 'monospace', fontSize: '1rem', resize: 'vertical', boxSizing: 'border-box' }}
          />

          {error && <p style={{ color: 'red', marginTop: '0.4rem', fontSize: '0.875rem' }}>{error}</p>}

          {preview && (
            <div style={{ marginTop: '0.75rem', fontSize: '0.875rem' }}>
              <p>✅ Found: <strong>{preview.found.length}</strong> students ({preview.found.join(', ')})</p>
              {preview.notFound.length > 0 && (
                <p style={{ color: 'orange' }}>⚠ Not found: {preview.notFound.join(', ')}</p>
              )}
            </div>
          )}
        </div>

        <div className="modal-footer">
          <button className="outline-button" onClick={onClose}>Cancel</button>
          {!preview
            ? <button className="primary-button" onClick={handlePreview}>Preview</button>
            : <button className="primary-button" onClick={handleApply}>Mark {preview.found.length} Present</button>
          }
        </div>
      </section>
    </div>
  )
}

// ── History Tab ───────────────────────────────────────────────────────────────

function HistoryTab() {
  const [sessions, setSessions]         = useState<AttendanceSession[]>([])
  const [loading, setLoading]           = useState(true)
  const [error, setError]               = useState<string | null>(null)
  const [viewingSession, setViewingSession] = useState<AttendanceSession | null>(null)

  useEffect(() => {
    setLoading(true)
    getSessions()
      .then(r => setSessions(r.sessions))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <p style={{ padding: '1rem' }}>Loading sessions…</p>
  if (error)   return <p style={{ color: 'red', padding: '1rem' }}>{error}</p>

  if (viewingSession) {
    return (
      <SessionDetail
        session={viewingSession}
        onBack={() => setViewingSession(null)}
      />
    )
  }

  return (
    <div className="panel table-panel">
      <div className="panel-heading">
        <div><h3>Past Attendance Sessions</h3><span>Click a session to view and edit records</span></div>
      </div>
      {sessions.length === 0 ? (
        <p style={{ padding: '1rem', color: 'var(--muted)' }}>No sessions recorded yet.</p>
      ) : (
        <div className="table-wrap">
          <table>
            <thead>
              <tr><th>#</th><th>Date</th><th>Class</th><th>Subject</th><th>Action</th></tr>
            </thead>
            <tbody>
              {sessions.map((s, i) => (
                <tr key={s.id}>
                  <td>{i + 1}</td>
                  <td>{new Date(s.sessionDate).toLocaleDateString()}</td>
                  <td>{s.classSubject?.class.name ?? '—'}</td>
                  <td>{s.classSubject?.subject.code} — {s.classSubject?.subject.name}</td>
                  <td>
                    <button className="row-action" title="View & Edit" onClick={() => setViewingSession(s)}>
                      <Edit2 size={14}/>
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}

// ── Session Detail + Edit ─────────────────────────────────────────────────────

function SessionDetail({ session, onBack }: { session: AttendanceSession; onBack: () => void }) {
  const [records, setRecords]     = useState<RecordRow[]>([])
  const [summary, setSummary]     = useState<{ totalPresent: number; totalAbsent: number } | null>(null)
  const [loading, setLoading]     = useState(true)
  const [error, setError]         = useState<string | null>(null)
  const [saving, setSaving]       = useState<number | null>(null)

  function loadRecords() {
    setLoading(true)
    getSessionRecords(session.id)
      .then(res => {
        setSummary({ totalPresent: res.summary.totalPresent, totalAbsent: res.summary.totalAbsent })
        setRecords([...res.records.present, ...res.records.absent].sort((a, b) =>
          a.student.studentId.localeCompare(b.student.studentId)
        ))
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { loadRecords() }, [session.id])

  async function handleToggle(record: RecordRow) {
    const newStatus = record.status === 'PRESENT' ? 'ABSENT' : 'PRESENT'
    setSaving(record.id)
    try {
      await updateAttendanceRecord(record.id, newStatus)
      setRecords(prev => prev.map(r => r.id === record.id ? { ...r, status: newStatus } : r))
      setSummary(prev => prev ? {
        totalPresent: prev.totalPresent + (newStatus === 'PRESENT' ? 1 : -1),
        totalAbsent:  prev.totalAbsent  + (newStatus === 'ABSENT'  ? 1 : -1),
      } : prev)
    } catch (e) {
      alert(e instanceof ApiError ? e.message : 'Failed to update record')
    } finally { setSaving(null) }
  }

  return (
    <div className="panel table-panel">
      <div className="panel-heading">
        <div>
          <h3>{session.classSubject?.class.name} · {session.classSubject?.subject.name}</h3>
          <span>{new Date(session.sessionDate).toLocaleDateString()}</span>
        </div>
        <button className="outline-button compact" onClick={onBack}>← Back</button>
      </div>

      {summary && (
        <div className="attendance-summary" style={{ padding: '0.75rem 1rem', borderBottom: '1px solid var(--border)' }}>
          <div><CheckCircle2 size={16}/><strong>{summary.totalPresent}</strong><span>Present</span></div>
          <div><X size={16}/><strong>{summary.totalAbsent}</strong><span>Absent</span></div>
        </div>
      )}

      {loading ? <p style={{ padding: '1rem' }}>Loading records…</p>
        : error ? <p style={{ color: 'red', padding: '1rem' }}>{error}</p>
        : records.length === 0 ? <p style={{ padding: '1rem', color: 'var(--muted)' }}>No records for this session yet.</p>
        : (
          <div className="table-wrap">
            <table>
              <thead>
                <tr><th>#</th><th>Student</th><th>Student ID</th><th>Status</th><th>Toggle</th></tr>
              </thead>
              <tbody>
                {records.map((r, i) => (
                  <tr key={r.id}>
                    <td>{i + 1}</td>
                    <td>{r.student.firstName} {r.student.lastName}</td>
                    <td>{r.student.studentId}</td>
                    <td>
                      <span className={`status ${r.status === 'PRESENT' ? 'active' : 'inactive'}`}>
                        {r.status}
                      </span>
                    </td>
                    <td>
                      <button
                        className={`attendance-toggle ${r.status === 'PRESENT' ? 'is-present' : 'is-absent'}`}
                        disabled={saving === r.id}
                        onClick={() => handleToggle(r)}
                        style={{ fontSize: '0.75rem', padding: '0.25rem 0.6rem' }}
                      >
                        {saving === r.id ? '…' : r.status === 'PRESENT' ? 'Mark Absent' : 'Mark Present'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )
      }
    </div>
  )
}

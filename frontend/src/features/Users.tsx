import { useEffect, useState } from 'react'
import { Pencil, Plus, Search, X } from 'lucide-react'
import { getUsers, getRoles, createUser, updateUser, deactivateUser } from '@/lib/api/users'
import type { User, RoleRecord } from '@/types/api'
import { ApiError } from '@/lib/api/client'

export default function Users() {
  const [users, setUsers]     = useState<User[]>([])
  const [roles, setRoles]     = useState<RoleRecord[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState<string | null>(null)
  const [search, setSearch]   = useState('')
  const [showAdd, setShowAdd] = useState(false)
  const [editing, setEditing] = useState<User | null>(null)

  function load() {
    setLoading(true)
    Promise.all([getUsers(), getRoles()])
      .then(([u, r]) => { setUsers(u.users); setRoles(r.roles) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }

  useEffect(() => { load() }, [])

  const filtered = users.filter(u =>
    u.username.toLowerCase().includes(search.toLowerCase()) ||
    u.email.toLowerCase().includes(search.toLowerCase())
  )

  async function handleDeactivate(id: number) {
    if (!confirm('Deactivate this user?')) return
    try { await deactivateUser(id); load() }
    catch (e) { alert(e instanceof ApiError ? e.message : 'Failed to deactivate') }
  }

  async function handleReactivate(u: User) {
    try { await updateUser(u.id, { isActive: true }); load() }
    catch (e) { alert(e instanceof ApiError ? e.message : 'Failed to reactivate') }
  }

  return (
    <>
      <div className="page-heading">
        <div><h1>Users</h1><p>Manage system users and their roles.</p></div>
      </div>

      <div className="panel table-panel">
        <div className="toolbar">
          <div className="table-search">
            <Search size={15}/>
            <input placeholder="Search users…" value={search} onChange={e => setSearch(e.target.value)}/>
          </div>
          <button className="primary-button compact" onClick={() => setShowAdd(true)}>
            <Plus size={15}/> Add User
          </button>
        </div>

        {loading ? <p style={{ padding: '1rem' }}>Loading…</p>
          : error ? <p style={{ padding: '1rem', color: 'red' }}>{error}</p>
          : (
            <div className="table-wrap">
              <table>
                <thead>
                  <tr><th>#</th><th>Username</th><th>Email</th><th>Role</th><th>Status</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {filtered.map((u, i) => (
                    <tr key={u.id}>
                      <td>{i + 1}</td>
                      <td>
                        <span className="name-cell">
                          <span className="mini-avatar">{u.username[0].toUpperCase()}</span>
                          {u.username}
                        </span>
                      </td>
                      <td>{u.email}</td>
                      <td>{u.role}</td>
                      <td>
                        <span className={`status ${u.isActive ? 'active' : 'inactive'}`}>
                          {u.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td style={{ display: 'flex', gap: '0.25rem' }}>
                        <button className="row-action" title="Edit" onClick={() => setEditing(u)}>
                          <Pencil size={13}/>
                        </button>
                        {u.isActive
                          ? <button className="row-action danger" title="Deactivate" onClick={() => handleDeactivate(u.id)}><X size={13}/></button>
                          : <button className="row-action" title="Reactivate" style={{ color: 'green' }} onClick={() => handleReactivate(u)}>↺</button>
                        }
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )
        }

        <div className="table-footer">
          <span>Showing {filtered.length} of {users.length} users</span>
        </div>
      </div>

      {showAdd && (
        <UserModal
          mode="add"
          roles={roles}
          onClose={() => setShowAdd(false)}
          onSaved={() => { setShowAdd(false); load() }}
        />
      )}

      {editing && (
        <UserModal
          mode="edit"
          roles={roles}
          initial={editing}
          onClose={() => setEditing(null)}
          onSaved={() => { setEditing(null); load() }}
        />
      )}
    </>
  )
}

// ── Add / Edit User modal ─────────────────────────────────────────────────────

function UserModal({
  mode, roles, initial, onClose, onSaved,
}: {
  mode: 'add' | 'edit'
  roles: RoleRecord[]
  initial?: User
  onClose: () => void
  onSaved: () => void
}) {
  const [form, setForm] = useState({
    username: initial?.username ?? '',
    email:    initial?.email    ?? '',
    password: '',
    roleId:   initial?.roleId   ?? roles[0]?.id ?? 0,
  })
  const [saving, setSaving] = useState(false)
  const [error, setError]   = useState<string | null>(null)
  const [done, setDone]     = useState(false)

  function set(field: string, value: string | number) {
    setForm(f => ({ ...f, [field]: value }))
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setSaving(true); setError(null)
    try {
      if (mode === 'add') {
        await createUser({ username: form.username, email: form.email, password: form.password, roleId: Number(form.roleId) })
      } else {
        const body: Parameters<typeof updateUser>[1] = {
          username: form.username,
          email:    form.email,
          roleId:   Number(form.roleId),
        }
        await updateUser(initial!.id, body)
      }
      setDone(true)
    } catch (e) {
      setError(e instanceof ApiError ? e.message : 'Failed to save user')
    } finally { setSaving(false) }
  }

  const title = mode === 'add' ? 'Add User' : 'Edit User'

  return (
    <div className="modal-backdrop" role="presentation" onMouseDown={e => e.target === e.currentTarget && onClose()}>
      <section className="modal" role="dialog" aria-modal>
        <div className="modal-header">
          <div><p className="eyebrow">USER MANAGEMENT</p><h2>{title}</h2></div>
          <button className="icon-button" onClick={onClose} aria-label="Close"><X size={18}/></button>
        </div>
        {done ? (
          <div className="modal-success">
            <h3>{mode === 'add' ? 'User created' : 'User updated'}</h3>
            {mode === 'add' && (form.roleId === roles.find(r => r.name === 'Subject Teacher')?.id || form.roleId === roles.find(r => r.name === 'Class Advisor')?.id) && (
              <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: '0.5rem' }}>
                ℹ️ Next step: go to <strong>Teachers</strong> and create a teacher profile for this user so they can be assigned to classes and subjects.
              </p>
            )}
            <button className="primary-button" onClick={onSaved}>Done</button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            {error && <p style={{ color: 'red', padding: '0 1.5rem' }}>{error}</p>}
            <div className="modal-fields">
              <label>Username
                <input required minLength={3} placeholder="e.g. john_doe" value={form.username} onChange={e => set('username', e.target.value)}/>
              </label>
              <label>Email
                <input required type="email" placeholder="e.g. john@school.com" value={form.email} onChange={e => set('email', e.target.value)}/>
              </label>
              {mode === 'add' && (
                <label>Password
                  <input required type="password" minLength={8} placeholder="Minimum 8 characters" value={form.password} onChange={e => set('password', e.target.value)}/>
                </label>
              )}
              <label>Role
                <select value={form.roleId} onChange={e => set('roleId', Number(e.target.value))}>
                  {roles.map(r => <option key={r.id} value={r.id}>{r.name}</option>)}
                </select>
              </label>
            </div>
            <div className="modal-footer">
              <button type="button" className="outline-button" onClick={onClose}>Cancel</button>
              <button type="submit" className="primary-button" disabled={saving}>
                {saving ? 'Saving…' : mode === 'add' ? 'Create User' : 'Save Changes'}
              </button>
            </div>
          </form>
        )}
      </section>
    </div>
  )
}

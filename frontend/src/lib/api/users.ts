import { apiFetch } from './client'
import type { User, RoleRecord } from '@/types/api'

export function getUsers(params?: { roleId?: number; isActive?: boolean }) {
  const q = new URLSearchParams()
  if (params?.roleId   !== undefined) q.set('roleId',   String(params.roleId))
  if (params?.isActive !== undefined) q.set('isActive', String(params.isActive))
  const qs = q.toString()
  return apiFetch<{ users: User[] }>(`/users${qs ? `?${qs}` : ''}`)
}

export function getRoles() {
  return apiFetch<{ roles: RoleRecord[] }>('/users/roles')
}

export function createUser(body: {
  username: string
  email: string
  password: string
  roleId: number
}) {
  return apiFetch<{ user: User }>('/users', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function updateUser(id: number, body: Partial<{
  username: string
  email: string
  roleId: number
  isActive: boolean
}>) {
  return apiFetch<{ user: User }>(`/users/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(body),
  })
}

export function deactivateUser(id: number) {
  return apiFetch<{ user: User }>(`/users/${id}`, { method: 'DELETE' })
}

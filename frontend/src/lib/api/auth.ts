import { apiFetch } from './client'
import type { LoginResponse, User } from '@/types/api'

export function login(body: { login: string; password: string }) {
  return apiFetch<LoginResponse>('/auth/login', {
    method: 'POST',
    body: JSON.stringify(body),
  })
}

export function getMe() {
  return apiFetch<{ user: User }>('/auth/me')
}

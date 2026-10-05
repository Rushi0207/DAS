import { apiFetch } from './client'
import type { Dashboard } from '@/types/api'

export function getDashboard() {
  return apiFetch<{ dashboard: Dashboard }>('/dashboard')
}

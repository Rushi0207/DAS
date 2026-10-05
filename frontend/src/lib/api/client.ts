import type { ApiErrorResponse } from '@/types/api'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? 'http://localhost:5000/api/v1'

// ─── Error class ──────────────────────────────────────────────────────────────

export class ApiError extends Error {
  readonly code: string
  readonly status: number
  readonly details?: Record<string, string[]>

  constructor(
    message: string,
    code: string,
    status: number,
    details?: Record<string, string[]>,
  ) {
    super(message)
    this.name = 'ApiError'
    this.code = code
    this.status = status
    this.details = details
  }
}

// ─── Token accessor ───────────────────────────────────────────────────────────

// Lazy import — avoids circular dependency between client and auth-store.
// auth-store writes to localStorage under this key.
const TOKEN_KEY = 'das_token'

function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY)
}

export { getToken, TOKEN_KEY }

// ─── Core fetch ───────────────────────────────────────────────────────────────

export async function apiFetch<T>(
  path: string,
  options: RequestInit = {},
): Promise<T> {
  const token = getToken()

  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options.headers,
    },
  })

  let payload: { success: boolean; data?: T; error?: ApiErrorResponse['error'] } | null = null

  try {
    payload = await response.json()
  } catch {
    throw new ApiError('Server returned an invalid response', 'INVALID_RESPONSE', response.status)
  }

  // Backend always returns { success: true, data: ... } or { success: false, error: { code, message, details } }
  if (!response.ok || payload?.success === false) {
    const err = payload?.error
    throw new ApiError(
      err?.message ?? 'An unexpected error occurred',
      err?.code   ?? 'INTERNAL_ERROR',
      response.status,
      err?.details,
    )
  }

  return payload!.data as T
}

export { API_BASE_URL }

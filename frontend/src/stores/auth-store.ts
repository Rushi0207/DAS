import { create } from 'zustand'
import * as authApi from '@/lib/api/auth'
import { TOKEN_KEY, ApiError } from '@/lib/api/client'
import type { User } from '@/types/api'

type AuthState = {
  user: User | null
  token: string | null
  isHydrated: boolean
  isLoading: boolean
  error: string | null

  login: (credentials: { login: string; password: string }) => Promise<void>
  logout: () => void
  hydrate: () => Promise<void>
  clearError: () => void
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  token: null,
  isHydrated: false,
  isLoading: false,
  error: null,

  login: async (credentials) => {
    set({ isLoading: true, error: null })
    try {
      const { token, user } = await authApi.login(credentials)
      localStorage.setItem(TOKEN_KEY, token)
      set({ user, token, isLoading: false })
    } catch (err) {
      const message = err instanceof ApiError ? err.message : 'Login failed'
      set({ isLoading: false, error: message })
      throw err
    }
  },

  logout: () => {
    localStorage.removeItem(TOKEN_KEY)
    set({ user: null, token: null, error: null })
  },

  // Called once on app mount — restores session from localStorage token
  hydrate: async () => {
    const token = localStorage.getItem(TOKEN_KEY)
    if (!token) {
      set({ isHydrated: true })
      return
    }
    try {
      const { user } = await authApi.getMe()
      set({ user, token, isHydrated: true })
    } catch {
      // Token is invalid or expired — clear it
      localStorage.removeItem(TOKEN_KEY)
      set({ user: null, token: null, isHydrated: true })
    }
  },

  clearError: () => set({ error: null }),
}))

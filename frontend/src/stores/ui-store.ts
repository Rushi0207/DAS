'use client'

import { create } from 'zustand'

type UiState = {
  sidebarOpen: boolean
  mobileNavOpen: boolean
  activeRoute: string
  setSidebarOpen: (open: boolean) => void
  setMobileNavOpen: (open: boolean) => void
  setActiveRoute: (route: string) => void
}

export const useUiStore = create<UiState>((set) => ({
  sidebarOpen: true,
  mobileNavOpen: false,
  activeRoute: '/dashboard',
  setSidebarOpen: (sidebarOpen) => set({ sidebarOpen }),
  setMobileNavOpen: (mobileNavOpen) => set({ mobileNavOpen }),
  setActiveRoute: (activeRoute) => set({ activeRoute }),
}))

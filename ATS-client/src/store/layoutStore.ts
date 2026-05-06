import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarWidth: 248,
      setSidebarWidth: (sidebarWidth) =>
        set({ sidebarWidth: Math.min(320, Math.max(220, sidebarWidth)) }),
    }),
    {
      name: 'ats-layout',
    },
  ),
)

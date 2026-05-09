import { create } from 'zustand'
import { persist } from 'zustand/middleware'

interface LayoutState {
  sidebarWidth: number
  setSidebarWidth: (width: number) => void
  isCollapsed: boolean
  toggleCollapse: () => void
}

export const useLayoutStore = create<LayoutState>()(
  persist(
    (set) => ({
      sidebarWidth: 260,
      setSidebarWidth: (sidebarWidth) => set({ sidebarWidth }),
      isCollapsed: false,
      toggleCollapse: () => set((state) => ({ isCollapsed: !state.isCollapsed })),
    }),
    {
      name: 'ats-layout',
    },
  ),
)

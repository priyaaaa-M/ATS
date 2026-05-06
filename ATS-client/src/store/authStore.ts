import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Company, User } from '../types'

interface AuthState {
  user: User | null
  company: Company | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setCompany: (company: Company | null) => void
  logout: () => void
  setLoading: (value: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      company: null,
      isAuthenticated: false,
      isLoading: true,
      setUser: (user) => set({ user, isAuthenticated: Boolean(user) }),
      setCompany: (company) => set({ company }),
      logout: () => set({ user: null, company: null, isAuthenticated: false }),
      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'ats-auth',
      partialize: (state) => ({
        user: state.user,
        company: state.company,
        isAuthenticated: state.isAuthenticated,
      }),
    },
  ),
)

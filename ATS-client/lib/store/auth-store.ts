import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { User, Company } from '../types'
import { applyBrandColor } from '../utils'

interface AuthState {
  user: User | null
  company: Company | null
  isAuthenticated: boolean
  isLoading: boolean
  setUser: (user: User | null) => void
  setCompany: (company: Company | null) => void
  updateCompany: (data: Partial<Company>) => void
  logout: () => void
  setLoading: (loading: boolean) => void
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      company: null,
      isAuthenticated: false,
      isLoading: true,

      setUser: (user) => set({ user, isAuthenticated: !!user }),
      
      setCompany: (company) => {
        if (company?.brand_color && typeof document !== 'undefined') {
          applyBrandColor(company.brand_color)
        }
        set({ company })
      },

      updateCompany: (data) => {
        const currentCompany = get().company
        if (currentCompany) {
          const updatedCompany = { ...currentCompany, ...data }
          if (data.brand_color && typeof document !== 'undefined') {
            applyBrandColor(data.brand_color)
          }
          set({ company: updatedCompany })
        }
      },

      logout: () => {
        set({ user: null, company: null, isAuthenticated: false, isLoading: false })
        if (typeof document !== 'undefined') {
          applyBrandColor('#0D7377')
        }
      },

      setLoading: (isLoading) => set({ isLoading }),
    }),
    {
      name: 'ats-auth-storage',
      onRehydrateStorage: () => (state) => {
        if (state?.company?.brand_color && typeof document !== 'undefined') {
          applyBrandColor(state.company.brand_color)
        }
        if (state) {
          state.setLoading(false)
        }
      }
    }
  )
)

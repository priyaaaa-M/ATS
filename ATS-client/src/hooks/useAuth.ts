import { useMemo } from 'react'
import { useAuthStore } from '../store/authStore'

export function useAuth() {
  const user = useAuthStore((state) => state.user)
  const company = useAuthStore((state) => state.company)
  const isAuthenticated = useAuthStore((state) => state.isAuthenticated)
  const isLoading = useAuthStore((state) => state.isLoading)

  return useMemo(
    () => ({ user, company, isAuthenticated, isLoading }),
    [company, isAuthenticated, isLoading, user],
  )
}

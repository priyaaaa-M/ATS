'use client'

import { useEffect } from 'react'
import { authApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth-store'

export function useInitAuth() {
  const { setUser, setCompany, setLoading, logout } = useAuthStore()

  useEffect(() => {
    let mounted = true

    const init = async () => {
      setLoading(true)
      try {
        const data = await authApi.getMe()
        if (!mounted) {
          return
        }

        if (data.authenticated && data.user) {
          setUser(data.user)
          setCompany(data.company ?? null)
        } else {
          logout()
        }
      } catch {
        if (mounted) {
          logout()
        }
      } finally {
        if (mounted) {
          setLoading(false)
        }
      }
    }

    void init()

    return () => {
      mounted = false
    }
  }, [logout, setCompany, setLoading, setUser])
}

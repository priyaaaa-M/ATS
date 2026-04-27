'use client'

import apiClient from './client'
import { mapCompany, mapUser } from './mappers'

export const authApi = {
  getMe: async () => {
    const { data } = await apiClient.get('/auth/me')
    if (!data?.authenticated || !data?.user) {
      return { authenticated: false, user: null, company: null }
    }

    return {
      authenticated: true,
      user: mapUser(data.user),
      company: data.user.company ? mapCompany(data.user.company) : null,
    }
  },

  loginWithGoogle: (inviteToken?: string) => {
    const url = new URL(
      '/auth/google',
      process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000'
    )
    if (inviteToken) {
      url.searchParams.set('inviteToken', inviteToken)
    }
    window.location.href = url.toString()
  },

  logout: async () => {
    const { data } = await apiClient.post('/auth/logout')
    return data
  },
}

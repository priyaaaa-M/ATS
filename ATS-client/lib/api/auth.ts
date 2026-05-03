'use client'

import apiClient from './client'
import { mapCompany, mapUser } from './mappers'

export const authApi = {
  getMe: async () => {
    const { data } = await apiClient.get('/auth/me', {
      withCredentials: true,
    })
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
    const url = new URL('/auth/google', window.location.origin)
    if (inviteToken) {
      url.searchParams.set('inviteToken', inviteToken)
    }
    if (window.top && window.top !== window) {
      window.top.location.assign(url.toString())
      return
    }
    window.location.assign(url.toString())
  },

  logout: async () => {
    const { data } = await apiClient.post('/auth/logout')
    return data
  },
}

'use client'

import type { Invite } from '@/lib/types'
import apiClient from './client'
import { mapInvite } from './mappers'

export const inviteApi = {
  generate: async (payload: {
    email: string
    roleName: string
    roundNumber: number
  }) => {
    const { data } = await apiClient.post('/api/invite/generate', payload)
    return {
      ...data,
      invite: data?.invite ? mapInvite(data.invite) : null,
    }
  },

  list: async (): Promise<Invite[]> => {
    const { data } = await apiClient.get('/api/invite')
    return (data || []).map(mapInvite)
  },

  validateToken: async (token: string) => {
    const { data } = await apiClient.get(`/api/invite/${token}`)
    return mapInvite(data)
  },

  accept: async (token: string) => {
    const { data } = await apiClient.post(`/api/invite/${token}/accept`)
    return data
  },
}

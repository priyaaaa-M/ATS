'use client'

import type { InterviewRound } from '@/lib/types'
import apiClient from './client'
import { mapRound } from './mappers'

export const roundsApi = {
  listByRole: async (roleName: string): Promise<InterviewRound[]> => {
    const { data } = await apiClient.get(`/api/rounds/${encodeURIComponent(roleName)}`)
    return (data || []).map(mapRound)
  },

  create: async (payload: {
    roleName: string
    roundNumber: number
    interviewerName: string
    interviewerGmail: string
  }) => {
    const { data } = await apiClient.post('/api/rounds', payload)
    return mapRound(data)
  },

  update: async (
    id: string,
    payload: { interviewerName?: string; interviewerGmail?: string }
  ) => {
    const { data } = await apiClient.put(`/api/rounds/${id}`, payload)
    return mapRound(data)
  },

  delete: async (id: string) => {
    const { data } = await apiClient.delete(`/api/rounds/${id}`)
    return data
  },
}

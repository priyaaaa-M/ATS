'use client'

import type { Interview } from '@/lib/types'
import apiClient from './client'
import { mapInterview } from './mappers'

export const interviewsApi = {
  list: async (): Promise<Interview[]> => {
    const { data } = await apiClient.get('/api/interviews')
    return (data || []).map(mapInterview)
  },

  book: async (payload: {
    candidateId: string
    candidateEmail: string
    interviewerEmail: string
    date: string
    startTime: string
    endTime: string
    roleName: string
    roundNumber: number
    durationMinutes: number
  }) => {
    const { data } = await apiClient.post('/api/interviews/book', payload)
    return {
      ...data,
      interview: data?.interview ? mapInterview(data.interview) : null,
    }
  },

  reschedule: async (
    id: string,
    payload: { date: string; startTime: string; endTime: string }
  ) => {
    const { data } = await apiClient.put(`/api/interviews/${id}/reschedule`, payload)
    return mapInterview(data)
  },

  cancel: async (id: string) => {
    const { data } = await apiClient.delete(`/api/interviews/${id}`)
    return mapInterview(data)
  },

  getByCandidateId: async (candidateId: string): Promise<Interview[]> => {
    const { data } = await apiClient.get(`/api/interviews/candidate/${candidateId}`)
    return (data || []).map(mapInterview)
  },
}

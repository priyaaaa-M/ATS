'use client'

import type { Candidate, CandidateFilters } from '@/lib/types'
import apiClient from './client'
import { mapCandidate } from './mappers'

export const candidatesApi = {
  list: async (params?: CandidateFilters): Promise<Candidate[]> => {
    const { data } = await apiClient.get('/api/candidates', { params })
    return (data || []).map(mapCandidate)
  },

  getById: async (id: string): Promise<Candidate | null> => {
    const { data } = await apiClient.get(`/api/candidates/${id}`)
    return data ? mapCandidate(data) : null
  },

  approve: async (id: string) => {
    const { data } = await apiClient.post(`/api/candidates/${id}/approve`)
    return mapCandidate(data)
  },

  reject: async (id: string) => {
    const { data } = await apiClient.post(`/api/candidates/${id}/reject`)
    return mapCandidate(data)
  },

  select: async (id: string) => {
    const { data } = await apiClient.post(`/api/candidates/${id}/select`)
    return mapCandidate(data)
  },

  advanceToNextRound: async (id: string) => {
    const { data } = await apiClient.post(`/api/candidates/${id}/advance`)
    return data?.candidate ? mapCandidate(data.candidate) : data
  },
}

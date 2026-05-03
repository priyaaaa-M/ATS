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

  moveToPipeline: async (id: string) => {
    const { data } = await apiClient.post(`/api/candidates/${id}/move-to-pipeline`)
    return mapCandidate(data)
  },

  notInterested: async (id: string, reason?: string) => {
    const { data } = await apiClient.post(`/api/candidates/${id}/not-interested`, {
      reason,
    })
    return mapCandidate(data)
  },

  addNote: async (id: string, text: string) => {
    const { data } = await apiClient.post(`/api/candidates/${id}/notes`, { text })
    return mapCandidate(data)
  },

  moveStage: async (id: string, stageName: string) => {
    const { data } = await apiClient.post(`/api/candidates/${id}/move-stage`, {
      stageName,
    })
    return mapCandidate(data)
  },
}

'use client'

import type { Transcript } from '@/lib/types'
import apiClient from './client'
import { mapTranscript } from './mappers'

export const transcriptApi = {
  getByRound: async (
    candidateId: string,
    roundNumber: number
  ): Promise<Transcript | null> => {
    const { data } = await apiClient.get(
      `/api/transcripts/${candidateId}/${roundNumber}`
    )
    return data ? mapTranscript(data) : null
  },

  saveManual: async (payload: {
    candidateId: string
    roundNumber: number
    transcriptText: string
    summary?: string
  }) => {
    const { data } = await apiClient.post('/api/transcripts/manual', payload)
    return mapTranscript(data)
  },

  triggerFetch: async (interviewId: string) => {
    const { data } = await apiClient.post(`/api/transcripts/fetch/${interviewId}`)
    return data
  },
}

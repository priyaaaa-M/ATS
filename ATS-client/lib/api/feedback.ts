'use client'

import type { Feedback } from '@/lib/types'
import apiClient from './client'
import { mapFeedback } from './mappers'

export const feedbackApi = {
  submit: async (payload: {
    candidateId: string
    roundNumber: number
    technicalRating: number
    communicationRating: number
    problemSolvingRating: number
    overallRating: number
    strengths: string
    weaknesses: string
    notes: string
    recommendation: string
  }) => {
    const { data } = await apiClient.post('/api/feedback', payload)
    return mapFeedback(data)
  },

  getByRound: async (
    candidateId: string,
    roundNumber: number
  ): Promise<Feedback[]> => {
    const { data } = await apiClient.get(
      `/api/feedback/${candidateId}/${roundNumber}`
    )
    return (data || []).map(mapFeedback)
  },
}

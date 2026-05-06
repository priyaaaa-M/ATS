import type { Feedback } from '../types'
import { api } from './client'

export const feedbackApi = {
  submit: (data: Feedback) => api.post('/api/feedback', data).then((r) => r.data),
  getByRound: (candidateId: string, roundNumber: number) => api.get<Feedback>(`/api/feedback/${candidateId}/${roundNumber}`).then((r) => r.data),
}

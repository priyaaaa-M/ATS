import type { Interview } from '../types'
import { api } from './client'

export const interviewsApi = {
  list: () => api.get<Interview[]>('/api/interviews').then((r) => r.data),
  book: (data: Record<string, unknown>) => api.post('/api/interviews/book', data).then((r) => r.data),
  reschedule: (id: string, data: Record<string, unknown>) => api.put(`/api/interviews/${id}/reschedule`, data).then((r) => r.data),
  getByCandidateId: (candidateId: string) => api.get<Interview[]>(`/api/interviews/candidate/${candidateId}`).then((r) => r.data),
}

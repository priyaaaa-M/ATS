import type { Interview } from '../types'
import { api } from './client'

export const interviewsApi = {
  list: () => api.get<Interview[]>('/api/interviews').then((r) => r.data),
  getByWeek: (params: { weekStart: string }) => api.get<Interview[]>('/api/interviews/week', { params }).then((r) => r.data),
  getMyInterviews: () => api.get<Interview[]>('/api/interviews/mine').then((r) => r.data),
  book: (data: Record<string, unknown>) => api.post('/api/interviews/book', data).then((r) => r.data),
  reschedule: (id: string, data: Record<string, unknown>) => api.put(`/api/interviews/${id}/reschedule`, data).then((r) => r.data),
  sendReminder: (id: string) => api.post(`/api/interviews/${id}/reminder`).then((r) => r.data),
  getByCandidateId: (candidateId: string) => api.get<Interview[]>(`/api/interviews/candidate/${candidateId}`).then((r) => r.data),
}

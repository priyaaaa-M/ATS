import type { InterviewRound } from '../types'
import { api } from './client'

export const roundsApi = {
  list: (roleName: string) => api.get<InterviewRound[]>(`/api/rounds/${encodeURIComponent(roleName)}`).then((r) => r.data),
  create: (data: { roleName: string; roundNumber: number; interviewerName: string; interviewerGmail: string }) => api.post<InterviewRound>('/api/rounds', data).then((r) => r.data),
  update: (id: string, data: Partial<InterviewRound>) => api.put(`/api/rounds/${id}`, data).then((r) => r.data),
  remove: (id: string) => api.delete(`/api/rounds/${id}`).then((r) => r.data),
}

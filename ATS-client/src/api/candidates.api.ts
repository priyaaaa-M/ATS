import type { Candidate } from '../types'
import { api } from './client'

export const candidatesApi = {
  list: (params?: Record<string, string | number | undefined>) => api.get<Candidate[]>('/api/candidates', { params }).then((r) => r.data),
  create: (data: FormData) => api.post('/api/candidates', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  getById: (id: string) => api.get<Candidate>(`/api/candidates/${id}`).then((r) => r.data),
  approve: (id: string) => api.post(`/api/candidates/${id}/approve`).then((r) => r.data),
  reject: (id: string) => api.post(`/api/candidates/${id}/reject`).then((r) => r.data),
  advanceRound: (id: string) => api.post(`/api/candidates/${id}/advance`).then((r) => r.data),
  moveStage: (id: string, stageName: string) => api.post(`/api/candidates/${id}/move-stage`, { stageName }).then((r) => r.data),
  action: (id: string, action: 'maybe_later' | 'reject' | 'interview' | 'select', reason?: string) => {
    if (action === 'reject') return api.post(`/api/candidates/${id}/not-interested`, { reason }).then((r) => r.data)
    if (action === 'interview') return api.post(`/api/candidates/${id}/move-to-pipeline`).then((r) => r.data)
    if (action === 'select') return api.post(`/api/candidates/${id}/select`).then((r) => r.data)
    return api.post(`/api/candidates/${id}/hr-advance`).then((r) => r.data)
  },
  addNote: (id: string, text: string, isPrivate?: boolean) => api.post(`/api/candidates/${id}/notes`, { text, isPrivate }).then((r) => r.data),
  submitScorecard: (id: string, data: unknown) => api.post(`/api/candidates/${id}/scorecard`, data).then((r) => r.data),
}

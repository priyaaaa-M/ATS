import type { Candidate, CandidateActivity, CandidateNote, Scorecard } from '../types'
import { api } from './client'

export const candidatesApi = {
  list: (params?: Record<string, string | number | undefined>) => api.get<Candidate[]>('/api/candidates', { params }).then((r) => r.data),
  approvedByMe: () => api.get<Candidate[]>('/api/candidates/approved-by-me').then((r) => r.data),
  getPipeline: (role?: string) =>
    api
      .get<{ inboxCandidates: Candidate[]; pipelineCandidates: Candidate[] }>('/api/candidates/pipeline', {
        params: { role },
      })
      .then((r) => r.data),
  getCounts: () => api.get<{ inbox: number; pipeline: number; all: number }>('/api/candidates/counts').then((r) => r.data),
  create: (data: FormData) => api.post('/api/candidates', data, { headers: { 'Content-Type': 'multipart/form-data' } }).then((r) => r.data),
  getById: (id: string) => api.get<Candidate>(`/api/candidates/${id}`).then((r) => r.data),
  approve: (id: string) => api.post(`/api/candidates/${id}/approve`).then((r) => r.data),
  reject: (id: string) => api.post(`/api/candidates/${id}/reject`).then((r) => r.data),
  advanceRound: (id: string) => api.post(`/api/candidates/${id}/advance`).then((r) => r.data),
  moveToStage: (id: string, stageId: string) => api.post(`/api/candidates/${id}/move-stage`, { stageId }).then((r) => r.data),
  action: (id: string, data: { action: 'maybe_later' | 'reject' | 'interview'; reason?: string }) =>
    api.post(`/api/candidates/${id}/action`, data).then((r) => r.data),
  getActivity: (id: string) => api.get<CandidateActivity[]>(`/api/candidates/${id}/activity`).then((r) => r.data),
  getNotes: (id: string) => api.get<CandidateNote[]>(`/api/candidates/${id}/notes`).then((r) => r.data),
  addNote: (id: string, data: { text: string; isPrivate?: boolean }) => api.post(`/api/candidates/${id}/notes`, data).then((r) => r.data),
  getScorecard: (id: string) => api.get<Scorecard | null>(`/api/candidates/${id}/scorecard`).then((r) => r.data),
  saveScorecard: (id: string, data: { criteria: Array<{ questionId: string; value: 'yes' | 'no' | 'unknown' }>; overallFit: string }) =>
    api.post(`/api/candidates/${id}/scorecard`, data).then((r) => r.data),
}

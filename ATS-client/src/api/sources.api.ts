import type { CandidateSource } from '../types'
import { api } from './client'

export const sourcesApi = {
  list: () => api.get<CandidateSource[]>('/api/sources').then((r) => r.data),
  create: (data: { name: string; description?: string }) =>
    api.post<CandidateSource>('/api/sources', data).then((r) => r.data),
  update: (id: string, data: Partial<Pick<CandidateSource, 'name' | 'description' | 'active'>>) =>
    api.put<CandidateSource>(`/api/sources/${id}`, data).then((r) => r.data),
  deactivate: (id: string) =>
    api.delete<CandidateSource>(`/api/sources/${id}`).then((r) => r.data),
}

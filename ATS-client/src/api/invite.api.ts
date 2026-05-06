import type { Invite } from '../types'
import { api } from './client'

export const inviteApi = {
  validate: (token: string) => api.get<Invite>(`/api/invite/${token}`).then((r) => r.data),
  generate: (data: Record<string, unknown>) => api.post('/api/invite/generate', data).then((r) => r.data),
  list: () => api.get<Invite[]>('/api/invite').then((r) => r.data),
  accept: (token: string) => api.post(`/api/invite/${token}/accept`).then((r) => r.data),
}

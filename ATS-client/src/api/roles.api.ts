import type { Role } from '../types'
import { api } from './client'

export const rolesApi = {
  list: () => api.get<Role[]>('/api/roles').then((r) => r.data),
  getScreeningQuestions: (roleName: string) =>
    api
      .get<Array<{ id: string; question: string; type?: 'yes_no' | 'scale'; required?: boolean }>>(
        `/api/roles/${roleName}/screening-questions`
      )
      .then((r) => r.data),
  updateScreeningQuestions: (
    roleName: string,
    screeningQuestions: Array<{ id?: string; question: string; type?: 'yes_no' | 'scale'; required?: boolean }>
  ) =>
    api
      .put(`/api/roles/${roleName}/screening-questions`, { screeningQuestions })
      .then((r) => r.data),
  syncFromDrive: () =>
    api.post('/api/roles/sync-from-drive').then((r) => r.data),
}

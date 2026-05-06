import type { Role } from '../types'
import { api } from './client'

export const rolesApi = {
  list: () => api.get<Role[]>('/api/role-details').then((r) => r.data),
  create: (data: Partial<Role>) => api.post('/api/role-details', data).then((r) => r.data),
  update: (id: string, data: Partial<Role>) => api.put(`/api/role-details/${id}`, data).then((r) => r.data),
  getById: (id: string) => api.get<Role>(`/api/role-details/${id}`).then((r) => r.data),
}

import type { Role } from '../types'
import { api } from './client'

type ApiRole = Partial<Role> & Pick<Role, 'id' | 'name'>

function normalizeRole(role: ApiRole): Role {
  return {
    ...role,
    title: role.title || role.name,
    status: role.status || 'open',
  }
}

export const rolesApi = {
  list: () => api.get<ApiRole[]>('/api/roles').then((r) => r.data.map(normalizeRole)),
  syncFromDrive: () => api.post<{ success: boolean; count: number; roles: ApiRole[] }>('/api/roles/sync-from-drive').then((r) => ({
    ...r.data,
    roles: r.data.roles.map(normalizeRole),
  })),
}

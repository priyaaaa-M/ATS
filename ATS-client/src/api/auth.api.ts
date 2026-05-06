import { api } from './client'
import type { Company, User } from '../types'

export const authApi = {
  getMe: () => api.get<{ authenticated: boolean; user: (User & { company?: Company | null }) | null }>('/auth/me').then((r) => r.data),
  logout: () => api.post('/auth/logout').then((r) => r.data),
}

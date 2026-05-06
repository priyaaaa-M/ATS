import type { Company } from '../types'
import { api } from './client'

export const companyApi = {
  getProfile: () => api.get<Company>('/api/company/profile').then((r) => r.data),
  updateProfile: (data: Partial<Company>) => api.put<Company>('/api/company/profile', data).then((r) => r.data),
  getDriveConfig: () => api.get('/api/company/drive-config').then((r) => r.data),
  saveDriveConfig: (data: Record<string, unknown>) => api.post('/api/company/drive-config', data).then((r) => r.data),
}

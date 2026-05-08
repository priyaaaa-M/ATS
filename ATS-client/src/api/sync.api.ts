import type { SyncStatus } from '../types'
import { api } from './client'

export const syncApi = {
  triggerSync: () => api.post('/api/sync/drive').then((r) => r.data),
  getStatus: () => api.get<SyncStatus>('/api/sync/status').then((r) => r.data),
  start: () => api.post('/api/sync/drive').then((r) => r.data),
  status: () => api.get<SyncStatus>('/api/sync/status').then((r) => r.data),
}

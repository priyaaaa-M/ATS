import type { SyncStatus } from '../types'
import { api } from './client'

export type DriveValidation = {
  valid: boolean
  issues: Array<{ type: string; message: string }>
  folders: Array<{
    roleName: string
    sourceName: string
    sourceFolderName: string
    resumeCount: number
  }>
}

export const syncApi = {
  triggerSync: () => api.post('/api/sync/drive').then((r) => r.data),
  validateDrive: () => api.get<DriveValidation>('/api/sync/drive/validate').then((r) => r.data),
  getStatus: () => api.get<SyncStatus>('/api/sync/status').then((r) => r.data),
  start: () => api.post('/api/sync/drive').then((r) => r.data),
  status: () => api.get<SyncStatus>('/api/sync/status').then((r) => r.data),
}

'use client'

import type { SyncStatus } from '@/lib/types'
import apiClient from './client'
import { mapSyncStatus } from './mappers'

export const syncApi = {
  triggerSync: async () => {
    const { data } = await apiClient.post('/api/sync/drive')
    return data
  },

  getStatus: async (): Promise<SyncStatus> => {
    const { data } = await apiClient.get('/api/sync/status')
    return mapSyncStatus(data)
  },
}

'use client'

import type { Role } from '@/lib/types'
import apiClient from './client'
import { mapRole } from './mappers'

export const rolesApi = {
  list: async (): Promise<Role[]> => {
    const { data } = await apiClient.get('/api/roles')
    return (data || []).map(mapRole)
  },

  syncFromDrive: async () => {
    const { data } = await apiClient.post('/api/roles/sync-from-drive')
    return data
  },
}

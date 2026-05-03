'use client'

import type { Role, RoleDetails } from '@/lib/types'
import apiClient from './client'
import { mapRole, mapRoleDetails } from './mappers'

export const rolesApi = {
  list: async (): Promise<RoleDetails[]> => {
    const { data } = await apiClient.get('/api/role-details')
    return (data || []).map(mapRoleDetails)
  },

  listLegacy: async (): Promise<Role[]> => {
    const { data } = await apiClient.get('/api/roles')
    return (data || []).map(mapRole)
  },

  getById: async (id: string): Promise<RoleDetails | null> => {
    const { data } = await apiClient.get(`/api/role-details/${id}`)
    return data ? mapRoleDetails(data) : null
  },

  create: async (payload: Partial<RoleDetails>) => {
    const { data } = await apiClient.post('/api/role-details', payload)
    return mapRoleDetails(data)
  },

  update: async (id: string, payload: Partial<RoleDetails>) => {
    const { data } = await apiClient.put(`/api/role-details/${id}`, payload)
    return mapRoleDetails(data)
  },

  remove: async (id: string) => {
    const { data } = await apiClient.delete(`/api/role-details/${id}`)
    return data
  },

  syncFromDrive: async () => {
    const { data } = await apiClient.post('/api/roles/sync-from-drive')
    return data
  },
}

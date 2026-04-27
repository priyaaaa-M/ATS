'use client'

import type { Company } from '@/lib/types'
import apiClient from './client'
import { mapCompany, mapDriveConfig } from './mappers'

export const companyApi = {
  getProfile: async (): Promise<Company> => {
    const { data } = await apiClient.get('/api/company/profile')
    return mapCompany(data)
  },

  updateProfile: async (payload: {
    name?: string
    logoUrl?: string
    brandColor?: string
    slackWebhookUrl?: string
    industry?: string
    size?: string
    description?: string
    website?: string
  }) => {
    const { data } = await apiClient.put('/api/company/profile', payload)
    return mapCompany(data)
  },

  getDriveConfig: async () => {
    const { data } = await apiClient.get('/api/company/drive-config')
    return mapDriveConfig(data)
  },

  saveDriveConfig: async (payload: { driveFolderLink: string }) => {
    const { data } = await apiClient.post('/api/company/drive-config', payload)
    return mapDriveConfig(data)
  },
}

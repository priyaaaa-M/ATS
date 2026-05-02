import apiClient from './client'

export interface DriveItem {
  id: string
  name: string
  mimeType: string
  webViewLink: string
  iconLink: string
  isFolder: boolean
}

export interface DriveContentsResponse {
  folderId: string
  contents: DriveItem[]
}

export const driveApi = {
  getContents: async (folderId?: string): Promise<DriveContentsResponse> => {
    const params = folderId ? { folderId } : {}
    const { data } = await apiClient.get('/api/drive/contents', { params })
    return data
  },

  createFolder: async (name: string, parentId?: string): Promise<DriveItem> => {
    const { data } = await apiClient.post('/api/drive/folders', { name, parentId })
    return data
  },
}

import type { ImportBatch } from '../types'
import { api } from './client'

export const importBatchesApi = {
  list: () => api.get<ImportBatch[]>('/api/import-batches').then((r) => r.data),
}

import { api } from './client'

export const transcriptApi = {
  getByRound: (candidateId: string, roundNumber: number) => api.get(`/api/transcripts/${candidateId}/${roundNumber}`).then((r) => r.data),
}

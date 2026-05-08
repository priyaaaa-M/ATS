import { api } from './client'

export const slackApi = {
  test: () => api.post('/api/slack/test').then((r) => r.data),
}

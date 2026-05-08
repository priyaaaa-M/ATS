import type { NotificationActivity } from '../types'
import { api } from './client'

export const dashboardApi = {
  getActivity: () =>
    api.get<NotificationActivity[]>('/api/dashboard/activity').then((r) => r.data),
}

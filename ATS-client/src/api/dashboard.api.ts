import type { NotificationActivity } from '../types'
import { api } from './client'

export type DashboardAction = {
  id: string
  title: string
  description: string
  count: number
  href: string
  tone: 'primary' | 'warning' | 'info' | 'danger' | string
}

export const dashboardApi = {
  getActivity: () =>
    api.get<NotificationActivity[]>('/api/dashboard/activity').then((r) => r.data),
  getActions: () =>
    api.get<DashboardAction[]>('/api/dashboard/actions').then((r) => r.data),
}

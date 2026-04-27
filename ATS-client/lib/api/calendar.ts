'use client'

import apiClient from './client'

export const calendarApi = {
  getFreeSlots: async (payload: {
    date: string
    interviewerEmail: string
    durationMinutes: number
  }) => {
    const { data } = await apiClient.post('/api/calendar/free-slots', payload)
    return data
  },
}

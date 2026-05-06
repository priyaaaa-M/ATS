import type { FreeSlotsResponse } from '../types'
import { api } from './client'

export const calendarApi = {
  freeSlots: (payload: { interviewerEmail: string; date: string; durationMinutes: number }) =>
    api.post<FreeSlotsResponse>('/api/calendar/free-slots', payload).then((r) => r.data),
}

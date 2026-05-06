import { useQuery } from '@tanstack/react-query'
import { calendarApi } from '../api'

export function useFreeSlots(payload: { interviewerEmail?: string; date?: string; durationMinutes: number }) {
  return useQuery({
    queryKey: ['free-slots', payload],
    queryFn: () =>
      calendarApi.freeSlots({
        interviewerEmail: payload.interviewerEmail ?? '',
        date: payload.date ?? '',
        durationMinutes: payload.durationMinutes,
      }),
    enabled: Boolean(payload.interviewerEmail && payload.date),
  })
}

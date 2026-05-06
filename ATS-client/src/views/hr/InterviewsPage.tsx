import { useMemo, useState } from 'react'
import { addDays, format, startOfWeek } from 'date-fns'
import { Calendar, List } from 'lucide-react'
import { useQuery } from '@tanstack/react-query'
import { interviewsApi } from '../../api'
import { PageHeader } from '../../components/shared/PageHeader'
import { Card, CardContent } from '../../components/ui/card'
import { Button } from '../../components/ui/button'
import { formatDateTime } from '../../lib/utils'

export function InterviewsPage() {
  const [mode, setMode] = useState<'list' | 'calendar'>('list')
  const [selectedDay, setSelectedDay] = useState(new Date())
  const { data: interviews = [] } = useQuery({ queryKey: ['interviews'], queryFn: interviewsApi.list })
  const week = Array.from({ length: 7 }).map((_, index) => addDays(startOfWeek(new Date(), { weekStartsOn: 1 }), index))
  const filtered = useMemo(() => interviews.filter((item) => item.scheduledAt ? format(new Date(item.scheduledAt), 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd') : item.status === 'pending'), [interviews, selectedDay])

  return (
    <div className="space-y-6">
      <PageHeader title="Interviews" actions={<div className="flex gap-2"><Button variant={mode === 'list' ? 'default' : 'secondary'} onClick={() => setMode('list')}><List className="h-4 w-4" /> List</Button><Button variant={mode === 'calendar' ? 'default' : 'secondary'} onClick={() => setMode('calendar')}><Calendar className="h-4 w-4" /> Calendar</Button></div>} />
      {mode === 'list' ? (
        <>
          <div className="flex gap-2 overflow-auto">
            {week.map((day) => <button key={day.toISOString()} className={`relative rounded-full px-4 py-3 text-sm ${format(day, 'yyyy-MM-dd') === format(selectedDay, 'yyyy-MM-dd') ? 'bg-[var(--brand)] text-white' : 'border bg-[var(--bg-card)]'}`} onClick={() => setSelectedDay(day)}>{format(day, 'EE d')}</button>)}
          </div>
          <div className="space-y-3">
            {filtered.map((interview) => (
              <Card key={interview.id} className="border-l-4" style={{ borderLeftColor: interview.status === 'scheduled' ? 'var(--brand)' : interview.status === 'pending' ? 'var(--warning)' : 'var(--success)' }}>
                <CardContent className="flex items-center justify-between pt-5">
                  <div>
                    <p className="text-sm font-semibold">{interview.candidateName}</p>
                    <p className="text-sm text-[var(--text-2)]">{interview.role} • {interview.stageName} • {interview.interviewerName}</p>
                    <p className="text-xs text-[var(--text-2)]">{interview.scheduledAt ? formatDateTime(interview.scheduledAt) : 'Pending booking'}</p>
                  </div>
                  <Button variant="secondary">{interview.status === 'scheduled' ? 'Join Meet' : interview.status === 'pending' ? 'Send Reminder' : interview.hasFeedback ? 'View Feedback' : 'Remind for Feedback'}</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </>
      ) : (
        <div className="grid grid-cols-7 gap-3">
          {Array.from({ length: 35 }).map((_, index) => {
            const day = addDays(startOfWeek(new Date()), index)
            const events = interviews.filter((item) => item.scheduledAt && format(new Date(item.scheduledAt), 'yyyy-MM-dd') === format(day, 'yyyy-MM-dd'))
            return (
              <div key={day.toISOString()} className="min-h-[120px] rounded-[12px] border bg-[var(--bg-card)] p-3">
                <p className="mb-2 text-sm font-semibold">{format(day, 'd')}</p>
                <div className="space-y-2">
                  {events.map((event) => <div key={event.id} className="truncate rounded-full bg-[var(--brand)] px-2 py-1 text-[11px] text-white">{event.candidateName}</div>)}
                </div>
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}

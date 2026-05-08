import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { addDays, format, formatDistanceToNow, isSameDay } from 'date-fns'
import {
  Calendar,
  CheckCircle2,
  ChevronLeft,
  ChevronRight,
  Clock,
  LayoutGrid,
  List,
  Loader2,
  User,
  Video,
  XCircle,
} from 'lucide-react'
import { toast } from 'sonner'
import { interviewsApi } from '../../api'
import { Button } from '../../components/ui/button'
import { Badge } from '../../components/ui/badge'
import { cn } from '../../lib/utils'

export function InterviewsPage() {
  const today = new Date()
  const [selectedDate, setSelectedDate] = useState(new Date())
  const [view, setView] = useState<'list' | 'calendar'>('list')
  const [weekStart, setWeekStart] = useState(new Date())

  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['interviews', format(weekStart, 'yyyy-MM-dd')],
    queryFn: () => interviewsApi.getByWeek({ weekStart: format(weekStart, 'yyyy-MM-dd') }),
  })

  const sendReminderMutation = useMutation({
    mutationFn: (interviewId: string) => interviewsApi.sendReminder(interviewId),
    onSuccess: () => toast.success('Reminder sent via Slack'),
    onError: () => toast.error('Failed to send reminder'),
  })

  const dayInterviews = interviews.filter((interview) => isSameDay(new Date(interview.scheduledStartTime || interview.scheduledAt || new Date()), selectedDate))
  const weekDays = Array.from({ length: 7 }).map((_, index) => addDays(weekStart, index))

  const stats = {
    scheduledThisWeek: interviews.filter((interview) => interview.status === 'scheduled').length,
    completed: interviews.filter((interview) => interview.status === 'completed').length,
    pendingSlot: interviews.filter((interview) => interview.status === 'pending_slot').length,
    cancelled: interviews.filter((interview) => interview.status === 'cancelled').length,
  }

  const grouped = useMemo(() => ({
    today: dayInterviews.filter((interview) => isSameDay(new Date(interview.scheduledStartTime || interview.scheduledAt || new Date()), new Date())),
    tomorrow: dayInterviews.filter((interview) => isSameDay(new Date(interview.scheduledStartTime || interview.scheduledAt || new Date()), addDays(new Date(), 1))),
    earlier: dayInterviews.filter((interview) => !isSameDay(new Date(interview.scheduledStartTime || interview.scheduledAt || new Date()), new Date()) && !isSameDay(new Date(interview.scheduledStartTime || interview.scheduledAt || new Date()), addDays(new Date(), 1))),
  }), [dayInterviews])

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Scheduled This Week', value: stats.scheduledThisWeek, icon: Calendar },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2 },
          { label: 'Pending Slot', value: stats.pendingSlot, icon: Clock },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle },
        ].map((stat) => (
          <div key={stat.label} className="rounded-xl border border-border bg-card p-4">
            <div className="flex items-center justify-between">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <stat.icon className="h-4 w-4 text-muted-foreground" />
            </div>
            <p className="mt-3 text-2xl font-semibold">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" disabled={format(weekStart, 'yyyy-MM-dd') <= format(today, 'yyyy-MM-dd')} onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-4 w-4" /></Button>
          <Button variant="outline" size="icon" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-4 w-4" /></Button>
        </div>
        <div className="flex items-center gap-2">
          <Button variant={view === 'list' ? 'default' : 'outline'} size="sm" onClick={() => setView('list')}><List className="mr-1 h-4 w-4" />List view</Button>
          <Button variant={view === 'calendar' ? 'default' : 'outline'} size="sm" onClick={() => setView('calendar')}><LayoutGrid className="mr-1 h-4 w-4" />Calendar view</Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-7">
        {weekDays.map((day) => (
          <button key={day.toISOString()} onClick={() => setSelectedDate(day)} className={cn('rounded-xl border px-4 py-3 text-left transition-colors', isSameDay(day, selectedDate) ? 'border-primary bg-primary/10' : 'border-border bg-card')}>
            <p className="text-xs uppercase text-muted-foreground">{format(day, 'EEE')}</p>
            <p className="mt-1 text-lg font-semibold">{format(day, 'd')}</p>
          </button>
        ))}
      </div>

      {isLoading ? (
        <div className="flex h-32 items-center justify-center"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
      ) : view === 'calendar' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {weekDays.map((day) => {
            const items = interviews.filter((interview) => isSameDay(new Date(interview.scheduledStartTime || interview.scheduledAt || new Date()), day))
            return (
              <div key={day.toISOString()} className="min-h-[180px] rounded-xl border border-border bg-card p-4">
                <p className="mb-3 font-semibold">{format(day, 'EEEE, MMM d')}</p>
                <div className="space-y-2">
                  {items.map((interview) => <div key={interview.id} className="rounded-lg bg-muted px-3 py-2 text-sm">{interview.candidateName}</div>)}
                  {items.length === 0 && <p className="text-sm text-muted-foreground">No interviews</p>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-6">
          {[
            { title: 'Today', items: grouped.today },
            { title: 'Tomorrow', items: grouped.tomorrow },
            { title: 'Earlier', items: grouped.earlier },
          ].map((group) => (
            <div key={group.title} className="space-y-3">
              <h2 className="text-sm font-semibold text-muted-foreground">{group.title}</h2>
              {group.items.length === 0 ? <div className="rounded-xl border border-dashed border-border p-4 text-sm text-muted-foreground">No interviews in this section.</div> : group.items.map((interview) => (
                <div key={interview.id} className={cn('grid grid-cols-[64px_1fr_auto] items-center gap-4 rounded-xl border border-border border-l-4 bg-card p-4', interview.status === 'scheduled' && 'border-l-primary', interview.status === 'pending_slot' && 'border-l-yellow-500', interview.status === 'completed' && 'border-l-green-500 opacity-75', interview.status === 'cancelled' && 'border-l-muted opacity-50')}>
                  <div className="text-center">
                    <p className="text-base font-bold leading-none">{format(new Date(interview.scheduledStartTime || interview.scheduledAt || new Date()), 'h:mm')}</p>
                    <p className="text-xs text-muted-foreground">{format(new Date(interview.scheduledStartTime || interview.scheduledAt || new Date()), 'a')}</p>
                    <Badge variant="outline" className="mt-1 px-1 text-xs">{interview.durationMinutes || 45} min</Badge>
                  </div>
                  <div>
                    <p className="text-sm font-semibold">{interview.candidateName}</p>
                    <p className="mb-2 text-xs text-muted-foreground">{interview.roleName || interview.role} · Round {interview.roundNumber}</p>
                    <div className="flex flex-wrap items-center gap-4">
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><User className="h-3 w-3" />{interview.interviewerEmail}</div>
                      {interview.meetLink && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Video className="h-3 w-3" />Google Meet</div>}
                      {interview.bookedAt && <div className="flex items-center gap-1.5 text-xs text-muted-foreground"><Clock className="h-3 w-3" />Booked {formatDistanceToNow(new Date(interview.bookedAt))} ago</div>}
                    </div>
                    {interview.status === 'pending_slot' && <p className="mt-1 flex items-center gap-1 text-xs text-yellow-500"><Clock className="h-3 w-3" />Interviewer hasn't scheduled yet</p>}
                    {interview.status === 'completed' && !interview.feedbackSubmitted && <p className="mt-1 text-xs text-red-500">No feedback submitted yet</p>}
                  </div>
                  <div className="flex flex-col items-end gap-2">
                    {interview.status === 'scheduled' && (
                      <>
                        <Badge className="border border-blue-500/30 bg-blue-500/15 text-blue-500">Scheduled</Badge>
                        {interview.meetLink && <a href={interview.meetLink} target="_blank"><Button size="sm" className="border border-green-500/30 bg-green-500/15 text-green-500 hover:bg-green-500/25"><Video className="mr-1 h-3 w-3" />Join Meet</Button></a>}
                        <Button variant="ghost" size="sm" className="text-xs text-muted-foreground">Reschedule</Button>
                      </>
                    )}
                    {interview.status === 'pending_slot' && (
                      <>
                        <Badge className="border border-yellow-500/30 bg-yellow-500/15 text-yellow-500">Pending slot</Badge>
                        <Button size="sm" className="border border-yellow-500/30 bg-yellow-500/15 text-yellow-500" onClick={() => sendReminderMutation.mutate(interview.id)} disabled={sendReminderMutation.isPending}>
                          {sendReminderMutation.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Send reminder'}
                        </Button>
                      </>
                    )}
                    {interview.status === 'completed' && (
                      <>
                        <Badge className="border border-green-500/30 bg-green-500/15 text-green-500">Completed</Badge>
                        <Button variant="outline" size="sm" className="text-xs">{interview.feedbackSubmitted ? 'View feedback' : 'Remind for feedback'}</Button>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

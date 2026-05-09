import { useMemo, useState } from 'react'
import { useMutation, useQuery } from '@tanstack/react-query'
import { addDays, format, formatDistanceToNow, isSameDay } from 'date-fns'
import { motion, AnimatePresence } from 'framer-motion'
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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Interviews</h1>
          <p className="text-muted-foreground text-sm">Manage scheduled interviews and pending slots.</p>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {[
          { label: 'Scheduled This Week', value: stats.scheduledThisWeek, icon: Calendar, color: 'text-brand' },
          { label: 'Completed', value: stats.completed, icon: CheckCircle2, color: 'text-emerald-400' },
          { label: 'Pending Slot', value: stats.pendingSlot, icon: Clock, color: 'text-amber-400' },
          { label: 'Cancelled', value: stats.cancelled, icon: XCircle, color: 'text-rose-400' },
        ].map((stat, i) => (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: i * 0.1 }}
            key={stat.label}
            className="rounded-2xl border border-border bg-card p-5 glass-card"
          >
            <div className="flex items-center justify-between mb-4">
              <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{stat.label}</p>
              <div className={`p-2 rounded-xl bg-muted ${stat.color}`}>
                <stat.icon className="h-5 w-5" />
              </div>
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/50 p-2 rounded-2xl border border-border">
        <div className="flex items-center gap-2 px-2">
          <Button variant="outline" size="icon" className="bg-muted border-border text-foreground hover:bg-muted/80 rounded-xl h-10 w-10" disabled={format(weekStart, 'yyyy-MM-dd') <= format(today, 'yyyy-MM-dd')} onClick={() => setWeekStart(addDays(weekStart, -7))}><ChevronLeft className="h-5 w-5" /></Button>
          <span className="text-sm font-semibold text-foreground px-2 min-w-[120px] text-center">{format(weekStart, 'MMM d')} - {format(addDays(weekStart, 6), 'MMM d, yyyy')}</span>
          <Button variant="outline" size="icon" className="bg-muted border-border text-foreground hover:bg-muted/80 rounded-xl h-10 w-10" onClick={() => setWeekStart(addDays(weekStart, 7))}><ChevronRight className="h-5 w-5" /></Button>
        </div>
        <div className="flex items-center gap-2 px-2 w-full md:w-auto">
          <Button variant={view === 'list' ? 'default' : 'outline'} className={cn("rounded-xl flex-1 md:flex-none", view === 'list' ? 'btn-primary-glow' : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted')} size="sm" onClick={() => setView('list')}><List className="mr-2 h-4 w-4" />List View</Button>
          <Button variant={view === 'calendar' ? 'default' : 'outline'} className={cn("rounded-xl flex-1 md:flex-none", view === 'calendar' ? 'btn-primary-glow' : 'bg-transparent border-transparent text-muted-foreground hover:text-foreground hover:bg-muted')} size="sm" onClick={() => setView('calendar')}><LayoutGrid className="mr-2 h-4 w-4" />Calendar View</Button>
        </div>
      </div>

      <div className="grid gap-2 md:grid-cols-7">
        {weekDays.map((day) => {
          const isSelected = isSameDay(day, selectedDate)
          return (
            <button key={day.toISOString()} onClick={() => setSelectedDate(day)} className={cn('relative overflow-hidden rounded-xl border px-4 py-4 text-center transition-all duration-300', isSelected ? 'border-brand/50 bg-brand/10 shadow-[0_0_15px_rgba(249,115,22,0.15)] text-brand' : 'border-border bg-card hover:bg-muted text-muted-foreground hover:text-foreground')}>
              <p className="text-[10px] uppercase font-bold tracking-widest">{format(day, 'EEE')}</p>
              <p className={cn("mt-1 text-2xl font-bold", isSelected ? 'text-brand' : 'text-foreground')}>{format(day, 'd')}</p>
              {isSelected && <motion.div layoutId="selectedDay" className="absolute bottom-0 left-0 right-0 h-1 bg-brand" />}
            </button>
          )
        })}
      </div>

      {isLoading ? (
        <div className="flex h-64 items-center justify-center"><Loader2 className="h-8 w-8 animate-spin text-brand" /></div>
      ) : view === 'calendar' ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {weekDays.map((day) => {
            const items = interviews.filter((interview) => isSameDay(new Date(interview.scheduledStartTime || interview.scheduledAt || new Date()), day))
            return (
              <div key={day.toISOString()} className="min-h-[200px] rounded-2xl border border-border bg-card p-5 glass-card">
                <p className="mb-4 font-semibold text-foreground flex items-center justify-between">
                  <span>{format(day, 'EEEE')}</span>
                  <span className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded-md">{format(day, 'MMM d')}</span>
                </p>
                <div className="space-y-3">
                  {items.map((interview) => (
                    <div key={interview.id} className={cn("rounded-xl px-4 py-3 text-sm border",
                      interview.status === 'scheduled' ? 'bg-brand/10 border-brand/20 text-brand-light' :
                        interview.status === 'completed' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-100' :
                          'bg-muted border-border text-foreground'
                    )}>
                      <p className="font-semibold">{interview.candidateName}</p>
                      <p className="text-xs opacity-70 mt-0.5 flex items-center gap-1.5"><Clock className="w-3 h-3" /> {format(new Date(interview.scheduledStartTime || interview.scheduledAt || new Date()), 'h:mm a')}</p>
                    </div>
                  ))}
                  {items.length === 0 && <p className="text-sm text-muted-foreground text-center py-6 border border-dashed border-border rounded-xl bg-background/50">No interviews</p>}
                </div>
              </div>
            )
          })}
        </div>
      ) : (
        <div className="space-y-8">
          {[
            { title: 'Today', items: grouped.today },
            { title: 'Tomorrow', items: grouped.tomorrow },
            { title: 'Earlier', items: grouped.earlier },
          ].map((group) => (
            <div key={group.title} className="space-y-4">
              <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <span>{group.title}</span>
                <span className="h-px flex-1 bg-border"></span>
                <span className="bg-muted px-2 py-0.5 rounded-full text-[10px]">{group.items.length}</span>
              </h2>
              <div className="grid gap-3">
                <AnimatePresence>
                  {group.items.length === 0 ? (
                    <div className="rounded-2xl border border-dashed border-border bg-card/50 p-8 text-center text-sm text-muted-foreground">No interviews in this section.</div>
                  ) : group.items.map((interview, index) => (
                    <motion.div
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ duration: 0.2, delay: index * 0.05 }}
                      key={interview.id}
                      className={cn(
                        'grid grid-cols-[80px_1fr_auto] items-center gap-5 rounded-2xl border bg-card p-5 transition-all hover:bg-muted group relative overflow-hidden',
                        interview.status === 'scheduled' ? 'border-border' :
                          interview.status === 'pending_slot' ? 'border-amber-500/30' :
                            interview.status === 'completed' ? 'border-emerald-500/30 opacity-80' : 'border-border opacity-50'
                      )}
                    >
                      {interview.status === 'scheduled' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-brand to-brand/20" />}
                      {interview.status === 'pending_slot' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-amber-500 to-amber-500/20" />}
                      {interview.status === 'completed' && <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-emerald-500 to-emerald-500/20" />}

                      <div className="text-center bg-muted rounded-xl p-3 border border-border group-hover:border-brand/30 transition-colors">
                        <p className="text-lg font-bold text-foreground leading-none">{format(new Date(interview.scheduledStartTime || interview.scheduledAt || new Date()), 'h:mm')}</p>
                        <p className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground mt-1">{format(new Date(interview.scheduledStartTime || interview.scheduledAt || new Date()), 'a')}</p>
                        <Badge variant="outline" className="mt-2 text-[9px] px-1.5 py-0 border-border bg-background/50 text-muted-foreground">{interview.durationMinutes || 45} min</Badge>
                      </div>
                      <div>
                        <p className="text-lg font-bold text-foreground group-hover:text-brand transition-colors">{interview.candidateName}</p>
                        <p className="mb-3 text-sm font-medium text-muted-foreground">{interview.roleName || interview.role} <span className="mx-2 text-muted-foreground/30">•</span> Round {interview.roundNumber}</p>
                        <div className="flex flex-wrap items-center gap-4">
                          <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md"><User className="h-3.5 w-3.5 text-brand" />{interview.interviewerEmail}</div>
                          {interview.meetLink && <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md"><Video className="h-3.5 w-3.5 text-blue-400" />Google Meet</div>}
                          {interview.bookedAt && <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-md"><Clock className="h-3.5 w-3.5 text-muted-foreground" />Booked {formatDistanceToNow(new Date(interview.bookedAt))} ago</div>}
                        </div>
                        {interview.status === 'pending_slot' && <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-amber-400 bg-amber-400/10 w-fit px-2 py-1 rounded-md"><Clock className="h-3.5 w-3.5" />Interviewer hasn't scheduled yet</p>}
                        {interview.status === 'completed' && !interview.feedbackSubmitted && <p className="mt-2.5 flex items-center gap-1.5 text-xs font-semibold text-rose-400 bg-rose-400/10 w-fit px-2 py-1 rounded-md"><XCircle className="h-3.5 w-3.5" />No feedback submitted yet</p>}
                      </div>
                      <div className="flex flex-col items-end gap-2.5">
                        {interview.status === 'scheduled' && (
                          <>
                            <Badge className="border-brand/30 bg-brand/10 text-brand hover:bg-brand/20 px-3 py-1 font-semibold rounded-lg">Scheduled</Badge>
                            {interview.meetLink && <a href={interview.meetLink} target="_blank" rel="noreferrer"><Button size="sm" className="rounded-xl border border-blue-500/30 bg-blue-500/15 text-blue-400 hover:bg-blue-500/25 hover:text-blue-300 font-semibold"><Video className="mr-2 h-3.5 w-3.5" />Join Meet</Button></a>}
                            <Button variant="ghost" size="sm" className="text-xs text-muted-foreground hover:text-foreground rounded-xl">Reschedule</Button>
                          </>
                        )}
                        {interview.status === 'pending_slot' && (
                          <>
                            <Badge className="border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 px-3 py-1 font-semibold rounded-lg">Pending slot</Badge>
                            <Button size="sm" className="rounded-xl border border-amber-500/30 bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 font-semibold" onClick={() => sendReminderMutation.mutate(interview.id)} disabled={sendReminderMutation.isPending}>
                              {sendReminderMutation.isPending ? <Loader2 className="mr-2 h-3.5 w-3.5 animate-spin" /> : <Clock className="mr-2 h-3.5 w-3.5" />}
                              {sendReminderMutation.isPending ? 'Sending...' : 'Send reminder'}
                            </Button>
                          </>
                        )}
                        {interview.status === 'completed' && (
                          <>
                            <Badge className="border-emerald-500/30 bg-emerald-500/10 text-emerald-400 hover:bg-emerald-500/20 px-3 py-1 font-semibold rounded-lg">Completed</Badge>
                            <Button variant="outline" size="sm" className="rounded-xl text-xs bg-muted border-border hover:bg-muted/80 text-foreground">{interview.feedbackSubmitted ? 'View feedback' : 'Remind for feedback'}</Button>
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

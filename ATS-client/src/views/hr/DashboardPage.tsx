import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Activity, CalendarClock, FileUp, Inbox, Trophy, Users } from 'lucide-react'
import { dashboardApi, importBatchesApi, interviewsApi } from '../../api'
import { HrOnboardingChecklist } from '../../components/onboarding/HrOnboardingChecklist'
import { Avatar } from '../../components/shared/Avatar'
import { EmptyState } from '../../components/shared/EmptyState'
import { useCandidates } from '../../hooks/useCandidates'
import { formatDateTime, timeAgo } from '../../lib/utils'

export function DashboardPage() {
  const { data: candidates = [] } = useCandidates({})
  const { data: interviews = [] } = useQuery({
    queryKey: ['interviews'],
    queryFn: interviewsApi.list,
    staleTime: 30_000,
  })
  const { data: importBatches = [] } = useQuery({
    queryKey: ['import-batches'],
    queryFn: importBatchesApi.list,
    staleTime: 30_000,
  })
  const { data: activities = [] } = useQuery({
    queryKey: ['activity'],
    queryFn: dashboardApi.getActivity,
    refetchInterval: 30_000,
  })
  const { data: actions = [] } = useQuery({
    queryKey: ['dashboard-actions'],
    queryFn: dashboardApi.getActions,
    refetchInterval: 30_000,
  })
  const primaryAction = actions.find((action) => action.count > 0) ?? actions[0]
  const secondaryActions = actions.filter((action) => action.id !== primaryAction?.id)

  const roleHealth = Object.values(
    candidates.reduce<Record<string, { role: string; total: number; review: number; active: number; hired: number }>>(
      (acc, candidate) => {
        const role = candidate.role || 'Unassigned'
        acc[role] ??= { role, total: 0, review: 0, active: 0, hired: 0 }
        acc[role].total += 1
        if (candidate.inboxStatus === 'inbox') acc[role].review += 1
        if (['hr_approved', 'scheduled', 'completed'].includes(candidate.status)) acc[role].active += 1
        if (candidate.status === 'selected') acc[role].hired += 1
        return acc
      },
      {},
    ),
  ).sort((a, b) => b.total - a.total)

  const snapshot = [
    { label: 'Candidates', value: candidates.length, icon: Users },
    { label: 'Needs Review', value: candidates.filter((item) => item.inboxStatus === 'inbox').length, icon: Inbox },
    { label: 'Scheduled', value: interviews.filter((item) => item.status === 'scheduled').length, icon: CalendarClock },
    { label: 'Hired', value: candidates.filter((item) => item.status === 'selected').length, icon: Trophy },
  ]

  return (
    <div className="space-y-7 pb-10">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your hiring command center.</p>
      </div>

      <motion.section
        className="glass-card p-6"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
      >
        <div className="mb-5 flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-semibold text-foreground">Today's Priority</h2>
            <p className="text-xs text-muted-foreground">Start here, then move through the smaller queues.</p>
          </div>
          <span className="text-xs text-muted-foreground">
            {actions.reduce((total, action) => total + action.count, 0)} open items
          </span>
        </div>

        {primaryAction ? (
          <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_minmax(320px,0.9fr)]">
            <a
              href={primaryAction.href}
              className="group rounded-xl border border-primary/30 bg-primary/10 p-5 transition-colors hover:border-primary/60 hover:bg-primary/15"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <p className="text-xs font-semibold uppercase tracking-wide text-primary">Next best action</p>
                  <h3 className="mt-2 text-xl font-bold text-foreground">{primaryAction.title}</h3>
                  <p className="mt-2 max-w-xl text-sm leading-relaxed text-muted-foreground">
                    {primaryAction.description}
                  </p>
                </div>
                <span className="flex h-12 min-w-12 items-center justify-center rounded-xl bg-background/70 px-3 text-xl font-bold text-primary">
                  {primaryAction.count}
                </span>
              </div>
              <p className="mt-5 inline-flex items-center gap-1 text-sm font-semibold text-primary">
                Open queue {'->'}
              </p>
            </a>

            <div className="grid gap-3 sm:grid-cols-3 xl:grid-cols-1">
              {secondaryActions.map((action) => (
                <a
                  key={action.id}
                  href={action.href}
                  className="flex items-center justify-between gap-3 rounded-xl border border-border bg-muted/20 px-4 py-3 transition-colors hover:border-primary/40 hover:bg-muted/40"
                >
                  <span className="min-w-0 truncate text-sm font-medium text-foreground">{action.title}</span>
                  <span className="flex h-8 min-w-8 items-center justify-center rounded-lg bg-muted px-2 text-sm font-bold text-foreground">
                    {action.count}
                  </span>
                </a>
              ))}
            </div>
          </div>
        ) : (
          <EmptyState icon={Inbox} title="No queue yet" description="Hiring tasks will appear here." />
        )}
      </motion.section>

      <HrOnboardingChecklist candidates={candidates} />

      <motion.section
        className="glass-card p-6"
        initial={{ opacity: 0, y: 18 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, delay: 0.05 }}
      >
        <div className="mb-5">
          <h2 className="text-lg font-semibold text-foreground">Role Pipeline Health</h2>
          <p className="text-xs text-muted-foreground">Role-level status for fast hiring decisions.</p>
        </div>
        {roleHealth.length ? (
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {roleHealth.slice(0, 6).map((role) => (
              <a
                key={role.role}
                href={`/candidates?role=${encodeURIComponent(role.role)}`}
                className="rounded-xl border border-border bg-muted/20 p-4 transition-colors hover:border-primary/50 hover:bg-muted/40"
              >
                <div className="mb-4 flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{role.role}</p>
                    <p className="mt-1 text-xs text-muted-foreground">{role.total} total candidates</p>
                  </div>
                  <span className="rounded-lg bg-primary/10 px-2 py-1 text-xs font-bold text-primary">{role.active} active</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center">
                  <div className="rounded-lg bg-background/50 px-2 py-2">
                    <p className="text-lg font-bold text-foreground">{role.review}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Review</p>
                  </div>
                  <div className="rounded-lg bg-background/50 px-2 py-2">
                    <p className="text-lg font-bold text-foreground">{role.active}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Process</p>
                  </div>
                  <div className="rounded-lg bg-background/50 px-2 py-2">
                    <p className="text-lg font-bold text-foreground">{role.hired}</p>
                    <p className="text-[10px] uppercase tracking-wide text-muted-foreground">Hired</p>
                  </div>
                </div>
              </a>
            ))}
          </div>
        ) : (
          <EmptyState icon={Users} title="No role pipeline yet" description="Import candidates to see role health." />
        )}
      </motion.section>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <motion.section className="glass-card p-0 overflow-hidden" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.1 }}>
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Upcoming Interviews</h3>
          </div>
          <div className="divide-y divide-border">
            {interviews.slice(0, 5).length ? interviews.slice(0, 5).map((interview) => (
              <div key={interview.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-5 hover:bg-muted/50 transition-colors">
                <div className="flex items-center gap-4 flex-1">
                  <Avatar name={interview.candidateName} size="md" className="ring-2 ring-border" />
                  <div>
                    <p className="text-sm font-semibold text-foreground mb-0.5">{interview.candidateName}</p>
                    <p className="text-xs text-muted-foreground">{interview.role} - <span className="text-brand/80">{interview.stageName}</span></p>
                  </div>
                </div>
                <div className="flex items-center gap-4 sm:justify-end">
                  <div className="text-right hidden md:block">
                    <p className="text-sm font-medium text-foreground">{formatDateTime(interview.scheduledAt)}</p>
                    <p className="text-xs text-muted-foreground">with {interview.interviewerName}</p>
                  </div>
                  {interview.meetLink && (
                    <a href={interview.meetLink} target="_blank" rel="noreferrer" className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg border border-border transition-colors">
                      Join Meet
                    </a>
                  )}
                </div>
              </div>
            )) : (
              <div className="p-10">
                <EmptyState icon={CalendarClock} title="No upcoming interviews" description="Booked interviews will show up here." />
              </div>
            )}
          </div>
        </motion.section>

        <motion.section className="glass-card p-0 overflow-hidden" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.15 }}>
          <div className="p-6 border-b border-border">
            <h3 className="text-lg font-semibold text-foreground">Recent Imports</h3>
          </div>
          <div className="divide-y divide-border">
            {importBatches.slice(0, 5).length ? importBatches.slice(0, 5).map((batch) => (
              <div key={batch.id} className="flex items-center gap-3 p-4">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <FileUp className="h-4 w-4" />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold text-foreground">
                    {batch.importMethod === 'google_drive' ? 'Drive Sync' : 'Manual Upload'}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">{batch.successfulCount} created, {batch.failedCount} failed</p>
                </div>
                <span className="text-xs text-muted-foreground">{timeAgo(batch.createdAt)}</span>
              </div>
            )) : (
              <div className="p-8">
                <EmptyState icon={FileUp} title="No imports yet" description="Uploads and syncs appear here." />
              </div>
            )}
          </div>
        </motion.section>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        <motion.section className="glass-card p-6 flex flex-col" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.2 }}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Snapshot</h3>
            <p className="text-xs text-muted-foreground">Compact totals for scanning.</p>
          </div>
          <div className="grid gap-3">
            {snapshot.map((item) => (
              <div key={item.label} className="flex items-center gap-3 rounded-xl border border-border bg-muted/20 p-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-primary">
                  <item.icon className="h-4 w-4" />
                </div>
                <span className="flex-1 text-sm text-muted-foreground">{item.label}</span>
                <span className="text-lg font-bold text-foreground">{item.value}</span>
              </div>
            ))}
          </div>
        </motion.section>

        <motion.section className="glass-card p-6 flex flex-col lg:col-span-2" initial={{ opacity: 0, y: 18 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.35, delay: 0.25 }}>
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
            <p className="text-xs text-muted-foreground">Latest updates from your team.</p>
          </div>
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {activities.slice(0, 5).map((item, i) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="relative flex flex-col items-center">
                  <div className={`h-3 w-3 rounded-full border-2 border-background z-10 ${item.type.includes('selected') ? 'bg-emerald-500' : item.type.includes('scheduled') ? 'bg-brand' : 'bg-[#444444]'}`} />
                  {i !== Math.min(activities.length, 5) - 1 && <div className="w-px h-full bg-border absolute top-3" />}
                </div>
                <div className="pb-4">
                  <p className="text-sm text-foreground font-medium mb-1 leading-snug">{item.message}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</p>
                </div>
              </div>
            ))}
            {activities.length === 0 && <EmptyState icon={Activity} title="No activity yet" description="Updates will appear here." />}
          </div>
        </motion.section>
      </div>
    </div>
  )
}

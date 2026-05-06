import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Activity, CalendarClock, Inbox, Trophy } from 'lucide-react'
import { interviewsApi } from '../../api'
import { Avatar } from '../../components/shared/Avatar'
import { Card, CardContent } from '../../components/ui/card'
import { EmptyState } from '../../components/shared/EmptyState'
import { PageHeader } from '../../components/shared/PageHeader'
import { useCandidates } from '../../hooks/useCandidates'
import { timeAgo, formatDateTime } from '../../lib/utils'

export function DashboardPage() {
  const { data: candidates = [] } = useCandidates({})
  const { data: interviews = [] } = useQuery({ queryKey: ['interviews'], queryFn: interviewsApi.list, staleTime: 30_000 })
  const stats = [
    { label: 'Total Candidates', value: candidates.length, icon: Activity },
    { label: 'Inbox', value: candidates.filter((item) => item.inboxStatus === 'inbox').length, icon: Inbox },
    { label: 'Scheduled', value: interviews.filter((item) => item.status === 'scheduled').length, icon: CalendarClock },
    { label: 'Selected', value: candidates.filter((item) => item.status === 'selected').length, icon: Trophy },
  ]
  const recentActivity = candidates.flatMap((candidate) => candidate.stageHistory ?? []).slice(0, 8)

  return (
    <div className="space-y-6">
      <PageHeader title="Dashboard" description="A quick pulse on pipeline health and recent movement." />
      <motion.div className="grid gap-4 lg:grid-cols-4" initial="hidden" animate="show" variants={{ hidden: {}, show: { transition: { staggerChildren: 0.05 } } }}>
        {stats.map((stat) => (
          <motion.div key={stat.label} variants={{ hidden: { opacity: 0, y: 10 }, show: { opacity: 1, y: 0 } }}>
            <Card>
              <CardContent className="flex items-center justify-between pt-5">
                <div>
                  <p className="text-[32px] font-semibold text-[var(--brand)]">{stat.value}</p>
                  <p className="text-[13px] text-[var(--text-2)]">{stat.label}</p>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-[10px] bg-[#f8fafc] text-[#667085]">
                  <stat.icon className="h-5 w-5" />
                </div>
              </CardContent>
            </Card>
          </motion.div>
        ))}
      </motion.div>
      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardContent className="pt-5">
            <p className="mb-4 text-sm font-semibold text-[#0b1220]">Upcoming Interviews</p>
            {interviews.slice(0, 5).length ? interviews.slice(0, 5).map((interview) => (
              <div key={interview.id} className="flex items-center gap-3 border-b border-[#eef2f6] py-3 last:border-b-0">
                <Avatar name={interview.candidateName} />
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-[#101828]">{interview.candidateName}</p>
                  <p className="truncate text-xs text-[#667085]">{interview.role} - {interview.stageName} - {formatDateTime(interview.scheduledAt)}</p>
                </div>
                {interview.meetLink ? <a href={interview.meetLink} className="text-sm font-medium text-[var(--brand)]">Join Meet</a> : null}
              </div>
            )) : <EmptyState icon={CalendarClock} title="No upcoming interviews" description="Booked interviews will show up here once scheduling is done." />}
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-5">
            <p className="mb-4 text-sm font-semibold text-[#0b1220]">Recent Activity</p>
            {recentActivity.length ? (
              <div className="space-y-4">
                {recentActivity.map((item) => (
                  <div key={item.id} className="flex gap-3">
                    <div className={`mt-2 h-2.5 w-2.5 rounded-full ${item.type === 'approval' ? 'bg-[var(--brand)]' : item.type === 'note' ? 'bg-[var(--info)]' : 'bg-[var(--text-3)]'}`} />
                    <div>
                      <p className="text-sm text-[#101828]">{item.text}</p>
                      <p className="text-xs text-[#667085]">{timeAgo(item.createdAt)}</p>
                    </div>
                  </div>
                ))}
              </div>
            ) : <EmptyState icon={Activity} title="No recent activity" description="Candidate updates and hiring events will appear here." />}
          </CardContent>
        </Card>
      </div>
    </div>
  )
}

import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Activity, CalendarClock, Inbox, Trophy, TrendingUp, Users } from 'lucide-react'
import { dashboardApi, interviewsApi } from '../../api'
import { Avatar } from '../../components/shared/Avatar'
import { EmptyState } from '../../components/shared/EmptyState'
import { useCandidates } from '../../hooks/useCandidates'
import { timeAgo, formatDateTime } from '../../lib/utils'
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts'

const data = [
  { name: 'Mon', candidates: 4 },
  { name: 'Tue', candidates: 7 },
  { name: 'Wed', candidates: 5 },
  { name: 'Thu', candidates: 12 },
  { name: 'Fri', candidates: 8 },
  { name: 'Sat', candidates: 3 },
  { name: 'Sun', candidates: 9 },
]

export function DashboardPage() {
  const { data: candidates = [] } = useCandidates({})
  const { data: interviews = [] } = useQuery({ queryKey: ['interviews'], queryFn: interviewsApi.list, staleTime: 30_000 })
  const { data: activities = [] } = useQuery({
    queryKey: ['activity'],
    queryFn: dashboardApi.getActivity,
    refetchInterval: 30_000,
  })
  
  const stats = [
    { label: 'Total Candidates', value: candidates.length, icon: Users, trend: '+12% this week' },
    { label: 'Needs Review', value: candidates.filter((item) => item.inboxStatus === 'inbox').length, icon: Inbox, trend: '4 urgent' },
    { label: 'Upcoming Interviews', value: interviews.filter((item) => item.status === 'scheduled').length, icon: CalendarClock, trend: 'Next: 2 hours' },
    { label: 'Hired YTD', value: candidates.filter((item) => item.status === 'selected').length, icon: Trophy, trend: '+2 vs last month' },
  ]

  return (
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-foreground mb-1">Dashboard</h1>
          <p className="text-muted-foreground text-sm">Welcome back. Here's what's happening with your hiring pipeline.</p>
        </div>
      </div>

      <motion.div 
        className="grid gap-6 md:grid-cols-2 lg:grid-cols-4" 
        initial="hidden" 
        animate="show" 
        variants={{ hidden: {}, show: { transition: { staggerChildren: 0.1 } } }}
      >
        {stats.map((stat) => (
          <motion.div 
            key={stat.label} 
            variants={{ 
              hidden: { opacity: 0, y: 20 }, 
              show: { opacity: 1, y: 0, transition: { duration: 0.4, ease: [0.22, 1, 0.36, 1] } } 
            }}
            className="glass-card p-6 relative overflow-hidden group"
          >
            <div className="absolute -right-4 -top-4 w-24 h-24 bg-brand/10 rounded-full blur-2xl group-hover:bg-brand/20 transition-colors" />
            
            <div className="flex items-start justify-between mb-4">
              <div className="h-10 w-10 rounded-xl bg-muted border border-border flex items-center justify-center text-brand">
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="flex items-center text-[11px] font-medium text-emerald-400 bg-emerald-400/10 px-2 py-1 rounded-md">
                <TrendingUp className="h-3 w-3 mr-1" />
                {stat.trend}
              </span>
            </div>
            
            <div>
              <p className="text-sm font-medium text-muted-foreground mb-1">{stat.label}</p>
              <p className="text-3xl font-bold text-foreground">{stat.value}</p>
            </div>
          </motion.div>
        ))}
      </motion.div>
      
      <div className="grid gap-6 lg:grid-cols-3">
        <motion.div 
          className="lg:col-span-2 glass-card p-6"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="text-lg font-semibold text-foreground">Pipeline Overview</h3>
              <p className="text-xs text-muted-foreground">Candidate inflow over the last 7 days</p>
            </div>
          </div>
          
          <div className="h-[280px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={data} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorCandidates" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#F97316" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#F97316" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="var(--color-border)" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} dy={10} />
                <YAxis axisLine={false} tickLine={false} tick={{ fill: '#94A3B8', fontSize: 12 }} />
                <Tooltip 
                  contentStyle={{ backgroundColor: 'var(--color-card)', borderColor: 'var(--color-border)', borderRadius: '8px', boxShadow: '0 10px 15px -3px rgba(0, 0, 0, 0.1)' }}
                  itemStyle={{ color: 'var(--color-foreground)' }}
                />
                <Area type="monotone" dataKey="candidates" stroke="#F97316" strokeWidth={3} fillOpacity={1} fill="url(#colorCandidates)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        <motion.div 
          className="glass-card p-6 flex flex-col"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.3 }}
        >
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-foreground">Recent Activity</h3>
            <p className="text-xs text-muted-foreground">Latest updates from your team</p>
          </div>
          
          <div className="flex-1 overflow-y-auto pr-2 space-y-6">
            {activities.slice(0, 5).map((item, i) => (
              <div key={item.id} className="flex gap-4 group">
                <div className="relative flex flex-col items-center">
                  <div className={`h-3 w-3 rounded-full border-2 border-background z-10 ${
                    item.type.includes('selected') ? 'bg-emerald-500' : 
                    item.type.includes('scheduled') ? 'bg-brand' : 'bg-[#444444]'
                  }`} />
                  {i !== Math.min(activities.length, 5) - 1 && (
                    <div className="w-px h-full bg-border absolute top-3" />
                  )}
                </div>
                <div className="pb-4">
                  <p className="text-sm text-foreground font-medium mb-1 leading-snug">{item.message}</p>
                  <p className="text-xs text-muted-foreground">{timeAgo(item.createdAt)}</p>
                </div>
              </div>
            ))}
            {activities.length === 0 && (
              <EmptyState
                icon={Activity}
                title="No activity yet"
                description="Updates will appear here."
              />
            )}
          </div>
        </motion.div>
      </div>

      <motion.div 
        className="glass-card p-0 overflow-hidden"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.4 }}
      >
        <div className="p-6 border-b border-border">
          <h3 className="text-lg font-semibold text-foreground">Upcoming Interviews</h3>
        </div>
        <div className="divide-y divide-border">
          {interviews.slice(0, 5).length ? interviews.slice(0, 5).map((interview) => (
            <div key={interview.id} className="flex flex-col sm:flex-row sm:items-center gap-4 p-6 hover:bg-muted/50 transition-colors">
              <div className="flex items-center gap-4 flex-1">
                <Avatar name={interview.candidateName} size="md" className="ring-2 ring-border" />
                <div>
                  <p className="text-sm font-semibold text-foreground mb-0.5">{interview.candidateName}</p>
                  <p className="text-xs text-muted-foreground">
                    {interview.role} • <span className="text-brand/80">{interview.stageName}</span>
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-6 sm:justify-end">
                <div className="text-right hidden md:block">
                  <p className="text-sm font-medium text-foreground">{formatDateTime(interview.scheduledAt)}</p>
                  <p className="text-xs text-muted-foreground">with {interview.interviewerName}</p>
                </div>
                {interview.meetLink && (
                  <a 
                    href={interview.meetLink} 
                    target="_blank" 
                    rel="noreferrer"
                    className="px-4 py-2 bg-muted hover:bg-muted/80 text-foreground text-xs font-medium rounded-lg border border-border transition-colors"
                  >
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
      </motion.div>
    </div>
  )
}

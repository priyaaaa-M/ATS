import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { 
  Activity, 
  CalendarClock, 
  FileUp, 
  Inbox, 
  Trophy, 
  Users, 
  Briefcase, 
  Calendar, 
  ArrowRight, 
  ChevronRight,
  Search,
  Bell,
  Sun,
  Code,
  Layout,
  Calculator,
  Terminal,
  Clock,
  ExternalLink,
  Plus
} from 'lucide-react'
import { 
  PieChart, 
  Pie, 
  Cell, 
  ResponsiveContainer,
  Tooltip
} from 'recharts'
import { dashboardApi, interviewsApi, rolesApi } from '../../api'
import { Avatar } from '../../components/shared/Avatar'
import { useCandidates } from '../../hooks/useCandidates'
import { timeAgo } from '../../lib/utils'
import { Button } from '../../components/ui/button'
import { cn } from '../../lib/utils'

export function DashboardPage() {
  const navigate = useNavigate()
  const { data: candidates = [] } = useCandidates({})
  const { data: interviews = [] } = useQuery({
    queryKey: ['interviews'],
    queryFn: interviewsApi.list,
    staleTime: 30_000,
  })
  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
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
        if (['hr_approved', 'scheduled', 'completed'].includes(candidate.status || '')) acc[role].active += 1
        if (candidate.status === 'selected') acc[role].hired += 1
        return acc
      },
      {},
    ),
  ).sort((a, b) => b.total - a.total)

  const interviewsToday = interviews.filter(i => {
    const d = new Date(i.scheduledAt)
    const today = new Date()
    return d.getDate() === today.getDate() && 
           d.getMonth() === today.getMonth() && 
           d.getFullYear() === today.getFullYear()
  })

  const hiredThisMonth = candidates.filter(c => {
    if (c.status !== 'selected') return false
    return true 
  }).length

  const summaryStats = [
    { 
      label: 'Total Candidates', 
      value: candidates.length, 
      change: '+12%', 
      trend: 'up', 
      icon: Users, 
      color: '#EC5B24' 
    },
    { 
      label: 'Open Roles', 
      value: roles.length, 
      change: '+1', 
      trend: 'up', 
      icon: Briefcase, 
      color: '#387DF1' 
    },
    { 
      label: 'Interviews Today', 
      value: interviewsToday.length, 
      change: interviewsToday.length > 0 ? `+${interviewsToday.length}` : '0', 
      trend: 'up', 
      icon: Calendar, 
      color: '#EAB308' 
    },
    { 
      label: 'Hired (Total)', 
      value: hiredThisMonth, 
      change: hiredThisMonth > 0 ? `+${hiredThisMonth}` : '0', 
      trend: 'up', 
      icon: Trophy, 
      color: '#10B981' 
    },
  ]

  const sourceStats = candidates.reduce<Record<string, number>>((acc, c) => {
    const src = c.source || 'Other'
    acc[src] = (acc[src] || 0) + 1
    return acc
  }, {})

  const sourceColors: Record<string, string> = {
    'referral': '#EC5B24',
    'campus': '#6366F1',
    'job_portal': '#387DF1',
    'drive': '#10B981',
    'Other': '#4B5563'
  }

  const sourceData = Object.entries(sourceStats).map(([name, value]) => ({
    name: name.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()),
    value,
    color: sourceColors[name] || sourceColors['Other']
  })).sort((a, b) => b.value - a.value)

  const getRoleIcon = (roleName: string) => {
    const r = roleName.toLowerCase()
    if (r.includes('front') || r.includes('back') || r.includes('soft')) return Code
    if (r.includes('cfo') || r.includes('finance')) return Calculator
    if (r.includes('unassigned')) return Layout
    return Terminal
  }

  const today = new Date()
  const days = []
  for (let i = -2; i <= 2; i++) {
    const d = new Date()
    d.setDate(today.getDate() + i)
    days.push({
      d: d.toLocaleDateString('en-US', { weekday: 'short' }),
      n: d.getDate(),
      active: i === 0,
      date: d
    })
  }

  return (
    <div className="space-y-8 pb-12">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Dashboard</h1>
        <p className="text-muted-foreground text-sm">Your hiring command center.</p>
      </header>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {summaryStats.map((stat, i) => (
          <motion.div 
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="glass-card p-5 group hover:border-white/20 transition-all cursor-default"
          >
            <div className="flex items-start justify-between mb-4">
              <div 
                className="p-2.5 rounded-xl bg-muted flex items-center justify-center border border-border"
                style={{ color: stat.color }}
              >
                <stat.icon className="h-5 w-5" />
              </div>
              <div className="flex flex-col items-end">
                <span className={cn(
                  "text-[11px] font-bold flex items-center gap-1",
                  stat.trend === 'up' ? 'text-green-500' : 'text-red-500'
                )}>
                  {stat.trend === 'up' ? '↑' : '↓'} {stat.change}
                  <span className="text-muted-foreground font-medium text-[10px]">vs last week</span>
                </span>
              </div>
            </div>
            <div>
              <p className="text-muted-foreground text-xs font-medium uppercase tracking-wider">{stat.label}</p>
              <h3 className="text-2xl font-bold text-white mt-1">{stat.value}</h3>
            </div>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-7 space-y-4"
        >
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-lg font-semibold text-white">Today's Priority</h2>
            <span className="text-xs text-muted-foreground">Focus on what matters most today.</span>
          </div>
          
          <div className="glass-card overflow-hidden relative group">
            <div className="absolute inset-0 bg-gradient-to-br from-brand/5 to-transparent opacity-50" />
            <div className="p-8 relative">
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
                <div className="space-y-4 max-w-md">
                   <div>
                      <p className="text-[11px] font-bold text-brand uppercase tracking-[0.2em]">Next Best Action</p>
                      <h3 className="text-2xl font-bold text-white mt-2">{primaryAction?.title || 'Candidates need HR review'}</h3>
                      <p className="text-muted-foreground text-sm mt-3 leading-relaxed">
                        {primaryAction?.description || 'Screen inbox resumes and approve strong matches for the next rounds.'}
                      </p>
                   </div>
                   <Button 
                    className="bg-brand hover:bg-brand/90 text-white rounded-xl px-6 h-11 gap-2 font-semibold shadow-lg shadow-brand/20 transition-all hover:scale-[1.02]"
                    onClick={() => navigate(primaryAction?.href || '/candidates?status=inbox')}
                   >
                      Open queue <ArrowRight className="h-4 w-4" />
                   </Button>
                </div>
                <div className="flex flex-col items-center justify-center p-6 bg-muted rounded-2xl border border-border min-w-[120px]">
                   <span className="text-4xl font-bold text-brand">{primaryAction?.count || 0}</span>
                   <span className="text-[10px] font-bold text-muted-foreground uppercase mt-1 tracking-widest">To Review</span>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        <motion.div 
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="lg:col-span-5 flex flex-col"
        >
          <div className="h-[28px] mb-4" />
          <div className="flex-1 space-y-3">
            {secondaryActions.length > 0 ? secondaryActions.map((action, i) => (
              <Link 
                key={action.id}
                to={action.href}
                className="flex items-center justify-between p-4 rounded-2xl bg-muted border border-border hover:bg-accent hover:border-border/80 transition-all group"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-xl bg-muted text-muted-foreground group-hover:text-white transition-colors">
                    {action.id.includes('booking') ? <Calendar className="h-4 w-4" /> : action.id.includes('batch') ? <FileUp className="h-4 w-4" /> : <Clock className="h-4 w-4" />}
                  </div>
                  <span className="text-sm font-medium text-white/80 group-hover:text-white">{action.title}</span>
                </div>
                <div className="flex items-center gap-3">
                   <span className="bg-accent px-2.5 py-0.5 rounded-lg text-xs font-bold text-white">{action.count}</span>
                   <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </div>
              </Link>
            )) : (
              <div className="flex-1 flex flex-col items-center justify-center border border-dashed border-border rounded-2xl bg-card p-8">
                 <p className="text-xs text-muted-foreground">No pending secondary actions</p>
              </div>
            )}
          </div>
        </motion.div>
      </div>

      <section className="space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-white">Role Pipeline Health</h2>
            <p className="text-xs text-muted-foreground">Real-time overview of your open roles.</p>
          </div>
          <Button variant="ghost" className="text-xs gap-2 text-muted-foreground hover:text-white" onClick={() => navigate('/roles')}>
             View all roles <ArrowRight className="h-3 w-3" />
          </Button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
           {roleHealth.length > 0 ? roleHealth.slice(0, 4).map((role, i) => {
             const Icon = getRoleIcon(role.role)
             return (
               <motion.div 
                key={role.role}
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ delay: i * 0.05 }}
                className="glass-card p-5 group hover:border-brand/30 transition-all cursor-pointer"
                onClick={() => navigate(`/candidates?role=${encodeURIComponent(role.role)}`)}
               >
                 <div className="flex items-start justify-between mb-5">
                    <div className="flex items-center gap-3 min-w-0">
                       <div className="p-2 rounded-lg bg-muted border border-border group-hover:text-brand group-hover:border-brand/20 transition-all">
                          <Icon className="h-4 w-4 text-brand" />
                       </div>
                       <div className="min-w-0">
                          <p className="text-sm font-bold text-white truncate">{role.role}</p>
                          <p className="text-[10px] text-muted-foreground mt-0.5">{role.total} total candidates</p>
                       </div>
                    </div>
                    <Badge variant="outline" className="bg-muted border-border text-[10px] text-muted-foreground">
                       {role.active} active
                    </Badge>
                 </div>

                 <div className="grid grid-cols-3 gap-3 mb-4">
                    <div className="text-center">
                       <p className="text-lg font-bold text-white">{role.review}</p>
                       <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">Review</p>
                    </div>
                    <div className="text-center">
                       <p className="text-lg font-bold text-white">{role.active}</p>
                       <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">Process</p>
                    </div>
                    <div className="text-center">
                       <p className="text-lg font-bold text-white">{role.hired}</p>
                       <p className="text-[9px] uppercase font-bold text-muted-foreground tracking-tighter">Hired</p>
                    </div>
                 </div>

                 <div className="h-1.5 w-full bg-muted rounded-full overflow-hidden flex">
                    <div className="h-full bg-brand" style={{ width: `${(role.review / (role.total || 1)) * 100}%` }} />
                    <div className="h-full bg-blue-500" style={{ width: `${(role.active / (role.total || 1)) * 100}%` }} />
                    <div className="h-full bg-emerald-500" style={{ width: `${(role.hired / (role.total || 1)) * 100}%` }} />
                 </div>
               </motion.div>
             )
           }) : (
             <div className="col-span-full py-12 text-center glass-card border-dashed">
                <p className="text-sm text-muted-foreground">No roles active. Create a role to see pipeline health.</p>
             </div>
           )}
        </div>
      </section>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        <div className="lg:col-span-4 glass-card p-6 flex flex-col h-[420px]">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-2">
                 <Activity className="h-4 w-4 text-brand" />
                 <h3 className="text-sm font-bold text-white">Recent Activity</h3>
              </div>
              <Button variant="ghost" size="sm" className="text-[10px] h-7 text-muted-foreground hover:text-white" onClick={() => navigate('/candidates')}>View all →</Button>
           </div>
           
           <div className="flex-1 space-y-6 overflow-y-auto pr-2 scrollbar-hide">
              {activities.length ? activities.slice(0, 5).map((activity, i) => (
                <div key={activity.id} className="flex gap-4">
                   <div className="flex-shrink-0">
                      <Avatar name={activity.actorName || '??'} size="sm" className="border border-white/10" />
                   </div>
                   <div className="space-y-1">
                      <p className="text-xs leading-relaxed text-white">
                        <span className="font-bold">{activity.actorName || 'Someone'}</span> {activity.message.replace(activity.actorName || '', '').trim()}
                      </p>
                      <p className="text-[10px] text-muted-foreground">{timeAgo(activity.createdAt)}</p>
                   </div>
                </div>
              )) : (
                <div className="h-full flex items-center justify-center">
                   <p className="text-xs text-muted-foreground">No recent activity</p>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 glass-card p-6 flex flex-col h-[420px]">
           <h3 className="text-sm font-bold text-white mb-6">Candidates by Source</h3>
           <div className="flex-1 flex flex-col items-center">
              {sourceData.length > 0 ? (
                <>
                  <div className="w-full h-44 relative">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={sourceData}
                          cx="50%"
                          cy="50%"
                          innerRadius={55}
                          outerRadius={75}
                          paddingAngle={5}
                          dataKey="value"
                        >
                          {sourceData.map((entry, index) => (
                            <Cell key={`cell-${index}`} fill={entry.color} stroke="none" />
                          ))}
                        </Pie>
                        <Tooltip 
                          contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px', fontSize: '12px' }}
                          itemStyle={{ color: '#fff' }}
                        />
                      </PieChart>
                    </ResponsiveContainer>
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                       <span className="text-2xl font-bold text-white">{candidates.length}</span>
                       <span className="text-[9px] uppercase font-bold text-muted-foreground">Total</span>
                    </div>
                  </div>

                  <div className="w-full mt-6 space-y-2.5 overflow-y-auto pr-1 scrollbar-hide">
                    {sourceData.map(source => (
                      <div key={source.name} className="flex items-center justify-between text-[11px]">
                          <div className="flex items-center gap-2">
                            <div className="h-2 w-2 rounded-full" style={{ backgroundColor: source.color }} />
                            <span className="text-muted-foreground font-medium">{source.name}</span>
                          </div>
                          <div className="flex items-center gap-3">
                            <span className="text-white font-bold">{source.value}</span>
                            <span className="text-muted-foreground font-mono">({Math.round((source.value/(candidates.length || 1))*100)}%)</span>
                          </div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="h-full flex items-center justify-center text-center p-8">
                   <p className="text-xs text-muted-foreground">No candidate data available to show sources.</p>
                </div>
              )}
           </div>
        </div>

        <div className="lg:col-span-4 glass-card p-6 flex flex-col h-[420px]">
           <div className="flex items-center justify-between mb-6">
              <h3 className="text-sm font-bold text-white">Interview Plan</h3>
              <Button variant="ghost" size="sm" className="text-[10px] h-7 text-muted-foreground hover:text-white" onClick={() => navigate('/interviews')}>View calendar →</Button>
           </div>

           <div className="grid grid-cols-5 gap-2 mb-6">
              {days.map(day => (
                <div key={day.n} className={cn(
                  "flex flex-col items-center py-2 rounded-xl border transition-all cursor-pointer",
                  day.active ? "bg-brand border-brand text-white shadow-lg shadow-brand/20" : "bg-muted border-border text-muted-foreground hover:bg-accent"
                )}>
                  <span className="text-[9px] uppercase font-bold opacity-70">{day.d}</span>
                  <span className="text-sm font-bold mt-1">{day.n}</span>
                </div>
              ))}
           </div>

           <div className="space-y-4">
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-widest">
                {today.toLocaleDateString('en-US', { day: 'numeric', month: 'long', year: 'numeric' })}
              </p>
              
              <div className="space-y-4 overflow-y-auto max-h-[180px] pr-2 scrollbar-hide">
                 {interviewsToday.length > 0 ? interviewsToday.map((meeting, i) => (
                   <div key={i} className="flex gap-4 group cursor-pointer" onClick={() => navigate('/interviews')}>
                      <span className="text-[10px] font-bold text-muted-foreground whitespace-nowrap pt-1 w-16">
                        {new Date(meeting.scheduledAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <div className="flex-1 space-y-1">
                         <div className="flex items-center justify-between">
                            <p className="text-xs font-bold text-white group-hover:text-brand transition-colors">{meeting.candidateName}</p>
                            <div className={cn("h-1.5 w-1.5 rounded-full bg-brand")} />
                         </div>
                         <p className="text-[10px] text-muted-foreground">
                            {meeting.role} – <span className="text-white/60">{meeting.stageName}</span>
                         </p>
                      </div>
                   </div>
                 )) : (
                   <div className="py-8 text-center bg-card border border-dashed border-border rounded-xl">
                      <p className="text-[10px] text-muted-foreground">No interviews scheduled for today</p>
                   </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  )
}

function Badge({ children, className, variant = 'default' }: { children: React.ReactNode; className?: string; variant?: 'default' | 'outline' }) {
  return (
    <span className={cn(
      "inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium",
      variant === 'outline' ? "border" : "bg-primary text-primary-foreground",
      className
    )}>
      {children}
    </span>
  )
}

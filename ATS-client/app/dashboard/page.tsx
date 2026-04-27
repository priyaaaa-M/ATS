'use client'

import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { Users, Clock, Calendar, CheckCircle } from 'lucide-react'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { AppShell } from '@/components/layout/app-shell'
import { candidatesApi } from '@/lib/api/candidates'
import { interviewsApi } from '@/lib/api/interviews'
import { useAuthStore } from '@/lib/store/auth-store'
import { formatDate } from '@/lib/utils'
import type { Candidate, Interview } from '@/lib/types'
import Link from 'next/link'
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from 'recharts'

const statCards = [
  { label: 'Total Candidates', icon: Users, key: 'total' },
  { label: 'Pending Review', icon: Clock, key: 'pending' },
  { label: 'Scheduled', icon: Calendar, key: 'scheduled' },
  { label: 'Selected', icon: CheckCircle, key: 'selected' },
]

export default function DashboardPage() {
  const { user, company } = useAuthStore()
  const { data: candidates = [], isLoading: candidatesLoading } = useQuery({
    queryKey: ['dashboard-candidates'],
    queryFn: () => candidatesApi.list(),
  })
  const { data: interviews = [], isLoading: interviewsLoading } = useQuery({
    queryKey: ['dashboard-interviews'],
    queryFn: interviewsApi.list,
  })
  const isLoading = candidatesLoading || interviewsLoading

  const stats = {
    total: candidates.length,
    pending: candidates.filter(c => c.status === 'pending').length,
    scheduled: candidates.filter(c => c.status === 'scheduled').length,
    selected: candidates.filter(c => c.status === 'selected').length,
  }

  const roleData = useMemo(() => {
    const data = [
      { name: 'Backend', pending: 0, approved: 0, scheduled: 0, selected: 0 },
      { name: 'Frontend', pending: 0, approved: 0, scheduled: 0, selected: 0 },
      { name: 'DevOps', pending: 0, approved: 0, scheduled: 0, selected: 0 },
      { name: 'Full Stack', pending: 0, approved: 0, scheduled: 0, selected: 0 },
    ]

    candidates.forEach((candidate) => {
      const roleIndex = data.findIndex((role) => candidate.role.includes(role.name))
      if (roleIndex !== -1) {
        if (candidate.status === 'pending') data[roleIndex].pending += 1
        else if (candidate.status === 'hr_approved') data[roleIndex].approved += 1
        else if (candidate.status === 'scheduled') data[roleIndex].scheduled += 1
        else if (candidate.status === 'selected') data[roleIndex].selected += 1
      }
    })

    return data
  }, [candidates])

  const greeting = () => {
    const hour = new Date().getHours()
    if (hour < 12) return 'Good morning'
    if (hour < 17) return 'Good afternoon'
    return 'Good evening'
  }

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div>
          <h1 className="font-[Syne] text-2xl md:text-3xl font-bold text-foreground">
            {greeting()}, {user?.name?.split(' ')[0] || 'there'}
          </h1>
          <p className="text-muted-foreground">
            {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            {' • '}
            {company?.name}
          </p>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {statCards.map((stat, index) => (
            <motion.div
              key={stat.key}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="bg-surface border-border relative overflow-hidden">
                <CardContent className="p-4 md:p-6">
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-[Syne] text-3xl md:text-4xl font-bold text-primary">
                        {isLoading ? '-' : stats[stat.key as keyof typeof stats]}
                      </p>
                      <p className="text-xs md:text-sm text-muted-foreground mt-1">
                        {stat.label}
                      </p>
                    </div>
                  </div>
                  <stat.icon className="absolute right-4 top-4 h-12 w-12 md:h-16 md:w-16 text-primary/10" />
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </div>

        {/* Main Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
          {/* Pipeline Chart */}
          <Card className="lg:col-span-3 bg-surface border-border">
            <CardHeader>
              <CardTitle className="font-[Syne] text-foreground">Pipeline Overview</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={roleData} barCategoryGap="20%">
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                    <XAxis 
                      dataKey="name" 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <YAxis 
                      tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 12 }}
                      axisLine={{ stroke: 'hsl(var(--border))' }}
                    />
                    <Tooltip 
                      contentStyle={{ 
                        backgroundColor: 'hsl(var(--surface))', 
                        border: '1px solid hsl(var(--border))',
                        borderRadius: '8px',
                      }}
                      labelStyle={{ color: 'hsl(var(--foreground))' }}
                    />
                    <Bar dataKey="pending" stackId="a" fill="hsl(var(--warning))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="approved" stackId="a" fill="hsl(var(--info))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="scheduled" stackId="a" fill="hsl(var(--primary))" radius={[0, 0, 0, 0]} />
                    <Bar dataKey="selected" stackId="a" fill="hsl(var(--success))" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="flex flex-wrap gap-4 mt-4 justify-center">
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-warning" />
                  <span className="text-xs text-muted-foreground">Pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-info" />
                  <span className="text-xs text-muted-foreground">Approved</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-primary" />
                  <span className="text-xs text-muted-foreground">Scheduled</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-3 w-3 rounded-sm bg-success" />
                  <span className="text-xs text-muted-foreground">Selected</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Recent Activity */}
          <Card className="lg:col-span-2 bg-surface border-border">
            <CardHeader>
              <CardTitle className="font-[Syne] text-foreground">Recent Activity</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {candidates.slice(0, 5).map((candidate, idx) => (
                  <div key={candidate.id} className="flex items-start gap-3">
                    <div className={`mt-1 h-2 w-2 rounded-full ${
                      candidate.status === 'selected' ? 'bg-success' :
                      candidate.status === 'rejected' ? 'bg-destructive' :
                      candidate.status === 'hr_approved' ? 'bg-info' :
                      'bg-warning'
                    }`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-foreground truncate">
                        <span className="font-medium">{candidate.name}</span>
                        {' '}
                        {candidate.status === 'selected' ? 'was selected' :
                         candidate.status === 'rejected' ? 'was rejected' :
                         candidate.status === 'hr_approved' ? 'was approved' :
                         'is pending review'}
                      </p>
                      <p className="text-xs text-muted-foreground">{candidate.role}</p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Upcoming Interviews */}
          <Card className="bg-surface border-border">
            <CardHeader className="flex flex-row items-center justify-between">
              <CardTitle className="font-[Syne] text-foreground">Upcoming Interviews</CardTitle>
              <Link href="/interviews">
                <Button variant="ghost" size="sm" className="text-primary">View All</Button>
              </Link>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {interviews.slice(0, 4).map((interview) => (
                  <div 
                    key={interview.id}
                    className="flex items-center gap-3 p-3 rounded-lg bg-surface-2"
                  >
                    <Avatar className="h-10 w-10">
                      <AvatarFallback className="bg-primary text-primary-foreground text-sm">
                        {interview.candidate_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">
                        {interview.candidate_name}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        Round {interview.round} • {interview.interviewer_name}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">
                        {formatDate(interview.scheduled_at)}
                      </p>
                      <a 
                        href={interview.meet_link} 
                        target="_blank" 
                        rel="noopener noreferrer"
                        className="text-xs text-primary hover:underline"
                      >
                        Join Meet
                      </a>
                    </div>
                  </div>
                ))}
                {interviews.length === 0 && (
                  <p className="text-sm text-muted-foreground text-center py-4">
                    No upcoming interviews
                  </p>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Role Pipeline */}
          <Card className="bg-surface border-border">
            <CardHeader>
              <CardTitle className="font-[Syne] text-foreground">Roles Pipeline</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {roleData.map((role) => {
                  const total = role.pending + role.approved + role.scheduled + role.selected
                  const selectedPercent = total > 0 ? (role.selected / total) * 100 : 0
                  return (
                    <div key={role.name} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="text-foreground font-medium">{role.name}</span>
                        <span className="text-muted-foreground">{total} candidates</span>
                      </div>
                      <div className="h-2 bg-surface-2 rounded-full overflow-hidden">
                        <div className="h-full flex">
                          <div 
                            className="bg-warning transition-all" 
                            style={{ width: `${total > 0 ? (role.pending / total) * 100 : 0}%` }} 
                          />
                          <div 
                            className="bg-info transition-all" 
                            style={{ width: `${total > 0 ? (role.approved / total) * 100 : 0}%` }} 
                          />
                          <div 
                            className="bg-primary transition-all" 
                            style={{ width: `${total > 0 ? (role.scheduled / total) * 100 : 0}%` }} 
                          />
                          <div 
                            className="bg-success transition-all" 
                            style={{ width: `${selectedPercent}%` }} 
                          />
                        </div>
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  )
}

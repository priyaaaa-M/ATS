'use client'

import { useQuery } from '@tanstack/react-query'
import { Calendar } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { interviewsApi } from '@/lib/api/interviews'
import { candidatesApi } from '@/lib/api/candidates'
import { Badge } from '@/components/ui/badge'
import { cn } from '@/lib/utils'
import { AppShell } from '@/components/layout/app-shell'

export default function InterviewsPage() {
  const { data: interviews = [], isLoading } = useQuery({
    queryKey: ['interviews'],
    queryFn: interviewsApi.list,
  })

  const { data: candidates = [] } = useQuery({
    queryKey: ['dashboard-candidates'],
    queryFn: () => candidatesApi.list(),
  })

  return (
    <AppShell>
      <div className="px-6 md:px-8 space-y-8 pb-10">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div className="flex flex-col gap-1">
            <h1 className="text-5xl font-black tracking-tight text-foreground">
              Interview <span className="text-muted-foreground/40 font-medium">Schedule</span>
            </h1>
            <p className="text-muted-foreground font-medium text-lg">Track and manage your upcoming interviews.</p>
          </div>
          <Button className="rounded-full bg-[#09090B] dark:bg-white text-white dark:text-black shadow-xl h-14 px-8 font-bold text-[14px] hover:scale-105 transition-all">
            Schedule Interview
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Today's Interviews */}
          <div className="lg:col-span-2 bg-card rounded-[2rem] shadow-premium overflow-hidden flex flex-col">
            <div className="px-8 py-6 flex justify-between items-center bg-secondary/10">
              <div className="flex items-center gap-3">
                <h2 className="text-lg font-black text-foreground">Today&apos;s Sessions</h2>
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-pulse" />
              </div>
              <div className="text-[12px] font-black uppercase tracking-widest text-muted-foreground/40">30 April 2025</div>
            </div>
            
            <div className="flex-1 divide-y-0 p-2">
              {isLoading ? (
                Array.from({ length: 3 }).map((_, i) => (
                  <div key={i} className="h-16 animate-pulse bg-background/30" />
                ))
              ) : interviews.map((interview) => (
                <div key={interview.id} className="flex items-center gap-5 px-6 py-5 hover:bg-secondary/5 rounded-[1.5rem] transition-all group cursor-pointer">
                  <div className="h-14 w-14 rounded-2xl bg-foreground text-background flex items-center justify-center text-[16px] font-black shadow-lg shadow-black/5">
                    {interview.candidate_name.split(' ').map(n => n[0]).join('')}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[15px] font-black text-foreground tracking-tight group-hover:text-primary transition-colors">{interview.candidate_name}</span>
                      <Badge variant="secondary" className="text-[10px] font-black bg-primary/10 text-primary uppercase tracking-wider px-2 py-0.5 rounded-full border-0">Backend</Badge>
                    </div>
                    <div className="text-[12px] font-bold text-muted-foreground/60 flex items-center gap-2">
                      <span className="text-foreground/80">{interview.interviewer_name}</span>
                      <span className="opacity-20">•</span>
                      <span>Round {interview.round}</span>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <div className="text-[16px] font-black text-foreground tracking-tighter mb-2">
                      2:00 PM
                    </div>
                    <a href={interview.meet_link} target="_blank" rel="noopener noreferrer" onClick={(e) => e.stopPropagation()}>
                      <Button variant="ghost" className="h-10 px-6 text-[12px] font-black bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 rounded-full transition-all">
                        Join Room
                      </Button>
                    </a>
                  </div>
                </div>
              ))}
              {!isLoading && interviews.length === 0 && (
                <div className="py-12 text-center text-ink-3 italic text-[13px]">
                  No interviews scheduled for today
                </div>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          <div className="bg-card rounded-[2rem] shadow-premium overflow-hidden flex flex-col h-fit">
            <div className="px-8 py-6 bg-secondary/10">
              <h2 className="text-lg font-black text-foreground">Live Feed</h2>
            </div>
            <div className="p-6 space-y-6">
              {candidates.slice(0, 6).map((c, i) => (
                <div key={i} className="flex gap-4 items-start group">
                  <div className={cn(
                    "h-10 w-10 rounded-xl flex items-center justify-center text-[14px] shrink-0 shadow-sm transition-all group-hover:scale-110",
                    i === 0 ? "bg-emerald-500/10 text-emerald-600" : 
                    i === 1 ? "bg-amber-500/10 text-amber-600" :
                    "bg-blue-500/10 text-blue-600"
                  )}>
                    {i === 0 ? '✓' : i === 1 ? '📅' : '👤'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-[14px] text-foreground leading-snug">
                      <span className="font-black">{c.name}</span> <span className="text-muted-foreground/80">{i === 0 ? 'approved for Backend R1' : i === 1 ? 'interview booked — Meera Nair' : 'added to the pipeline'}</span>
                    </p>
                    <p className="text-[11px] font-black text-muted-foreground/30 uppercase tracking-widest mt-1.5">{i * 10 + 2} min ago</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

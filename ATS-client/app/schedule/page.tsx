'use client'

import { useQuery } from '@tanstack/react-query'
import { Calendar as CalendarIcon, Clock, Video, User } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Skeleton } from '@/components/ui/skeleton'
import { interviewsApi } from '@/lib/api/interviews'
import { useAuthStore } from '@/lib/store/auth-store'
import { formatDate } from '@/lib/utils'
import type { Interview } from '@/lib/types'

export default function SchedulePage() {
  const { data: interviews = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['schedule-interviews'],
    queryFn: interviewsApi.list,
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-[Syne] text-2xl font-bold text-foreground flex items-center gap-3">
            <CalendarIcon className="h-6 w-6 text-primary" />
            My Schedule
            <Badge className="bg-primary text-primary-foreground">
              {interviews.length}
            </Badge>
          </h1>
          <p className="text-muted-foreground">Your upcoming interviews</p>
        </div>

        {isLoading ? (
          <div className="space-y-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-24 bg-surface-2" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            Failed to load your schedule.
            <Button variant="link" onClick={() => refetch()} className="px-2">
              Retry
            </Button>
          </div>
        ) : (
          <div className="space-y-4">
            {interviews.map((interview) => (
              <Card key={interview.id} className="bg-surface border-border">
                <CardContent className="p-4">
                  <div className="flex items-center gap-4">
                    <Avatar className="h-12 w-12">
                      <AvatarFallback className="bg-primary text-primary-foreground">
                        {interview.candidate_name.split(' ').map(n => n[0]).join('')}
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex-1">
                      <h3 className="font-semibold text-foreground">{interview.candidate_name}</h3>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatDate(interview.scheduled_at)}
                        </span>
                        <Badge variant="outline" className="bg-primary/10 text-primary border-primary/30">
                          Round {interview.round}
                        </Badge>
                      </div>
                    </div>
                    <a 
                      href={interview.meet_link}
                      target="_blank"
                      rel="noopener noreferrer"
                    >
                      <Button className="bg-primary text-primary-foreground">
                        <Video className="mr-2 h-4 w-4" />
                        Join Meeting
                      </Button>
                    </a>
                  </div>
                </CardContent>
              </Card>
            ))}
            {interviews.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <CalendarIcon className="mx-auto h-12 w-12 mb-4 opacity-50" />
                <p>No upcoming interviews scheduled</p>
              </div>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

'use client'

import Link from 'next/link'
import { useQuery } from '@tanstack/react-query'
import { useParams } from 'next/navigation'
import { ArrowLeft, Edit3 } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { PipelineBoard } from '@/components/PipelineBoard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent } from '@/components/ui/card'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { rolesApi } from '@/lib/api'

const defaultStages = [
  { name: 'Screening', order: 1 },
  { name: 'Recruiter Call', order: 2 },
  { name: 'Hiring Manager Interview', order: 3 },
  { name: 'Technical Assessment', order: 4 },
  { name: 'Final Interview', order: 5 },
  { name: 'Offer', order: 6 },
  { name: 'Hired', order: 7 },
]

export default function RoleDetailPage() {
  const params = useParams()
  const roleId = params.id as string
  const { data: role, isLoading, isError, refetch } = useQuery({
    queryKey: ['role-details', roleId],
    queryFn: () => rolesApi.getById(roleId),
    enabled: Boolean(roleId),
  })

  if (isLoading) {
    return (
      <AppShell>
        <Skeleton className="h-[560px] bg-surface-2" />
      </AppShell>
    )
  }

  if (isError || !role) {
    return (
      <AppShell>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          Failed to load role.
          <Button variant="link" onClick={() => refetch()} className="px-2">
            Retry
          </Button>
        </div>
      </AppShell>
    )
  }

  const roleName = role.title || role.name
  const stages = role.interviewStages?.length ? role.interviewStages : defaultStages

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button asChild variant="ghost" className="w-fit">
            <Link href="/roles">
              <ArrowLeft className="mr-2 h-4 w-4" />
              Back
            </Link>
          </Button>
          <Button asChild>
            <Link href={`/roles/${role.id}/edit`}>
              <Edit3 className="mr-2 h-4 w-4" />
              Edit
            </Link>
          </Button>
        </div>

        <div className="rounded-2xl border border-border bg-surface p-6">
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div>
              <h1 className="font-[Syne] text-3xl font-bold">{roleName}</h1>
              <div className="mt-2 flex flex-wrap gap-2">
                <Badge>{role.status || 'open'}</Badge>
                <Badge variant="secondary">{role.candidateCount || 0} candidates</Badge>
              </div>
            </div>
          </div>
        </div>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
            {['overview', 'screening', 'pipeline', 'candidates'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="border border-border bg-surface data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-surface border-border">
                <CardContent className="space-y-3 p-6">
                  <p className="text-sm font-medium text-muted-foreground">Description</p>
                  <p>{role.description || 'No description yet.'}</p>
                  <p className="text-sm font-medium text-muted-foreground">Hiring Goals</p>
                  <p>{role.hiringGoals || '—'}</p>
                  <p className="text-sm font-medium text-muted-foreground">Expectations</p>
                  <p>{role.expectations || '—'}</p>
                  <p className="text-sm font-medium text-muted-foreground">Activities</p>
                  <p>{role.activities || '—'}</p>
                  <p className="text-sm font-medium text-muted-foreground">Selling Points</p>
                  <p>{role.sellingPoints || '—'}</p>
                </CardContent>
              </Card>

              <Card className="bg-surface border-border">
                <CardContent className="space-y-3 p-6">
                  <p className="text-sm font-medium text-muted-foreground">Salary Range</p>
                  <p>
                    {role.salaryCurrency || 'INR'} {role.salaryMin || '—'} - {role.salaryMax || '—'}
                  </p>
                  <p className="text-sm font-medium text-muted-foreground">Work Tags</p>
                  <div className="flex flex-wrap gap-2">
                    {(role.workTags || []).map((tag) => (
                      <Badge key={tag} variant="outline">
                        {tag}
                      </Badge>
                    ))}
                  </div>
                  <p className="text-sm font-medium text-muted-foreground">Hiring Manager</p>
                  <p>{role.hiringManagerName || 'Unassigned'}</p>
                  <p className="text-sm font-medium text-muted-foreground">Stage Count</p>
                  <p>{stages.length}</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="screening">
            <div className="space-y-3">
              {(role.screeningQuestions || []).length > 0 ? (
                (role.screeningQuestions || []).map((question, index) => (
                  <Card key={`${question.question}-${index}`} className="bg-surface border-border">
                    <CardContent className="space-y-2 p-4">
                      <div className="flex items-center justify-between gap-3">
                        <p className="font-medium">{question.question}</p>
                        <Badge variant="secondary">{question.type}</Badge>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        Ideal answer: {question.ideal_answer || '—'}
                      </p>
                    </CardContent>
                  </Card>
                ))
              ) : (
                <p className="text-sm text-muted-foreground">No screening questions configured.</p>
              )}
            </div>
          </TabsContent>

          <TabsContent value="pipeline">
            <PipelineBoard roleId={roleName} stages={stages} />
          </TabsContent>

          <TabsContent value="candidates">
            <PipelineBoard roleId={roleName} stages={stages} />
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Grid2x2, Inbox, List, Search } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/app-shell'
import { CandidateCard } from '@/components/candidates/candidate-card'
import { PipelineBoard } from '@/components/PipelineBoard'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Skeleton } from '@/components/ui/skeleton'
import { candidatesApi } from '@/lib/api'
import type { Candidate } from '@/lib/types'
import { cn } from '@/lib/utils'

const defaultStages = [
  { name: 'Screening', order: 1 },
  { name: 'Recruiter Call', order: 2 },
  { name: 'Hiring Manager Interview', order: 3 },
  { name: 'Technical Assessment', order: 4 },
  { name: 'Final Interview', order: 5 },
  { name: 'Offer', order: 6 },
  { name: 'Hired', order: 7 },
]

export default function CandidatesPage() {
  const queryClient = useQueryClient()
  const [viewMode, setViewMode] = useState<'list' | 'board'>('list')
  const [scope, setScope] = useState<'inbox' | 'pipeline' | 'all'>('inbox')
  const [search, setSearch] = useState('')

  const { data: allCandidates = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['candidates', 'all'],
    queryFn: () => candidatesApi.list(),
  })

  const moveToPipelineMutation = useMutation({
    mutationFn: candidatesApi.moveToPipeline,
    onSuccess: () => {
      toast.success('Candidate added to pipeline')
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })

  const notInterestedMutation = useMutation({
    mutationFn: (id: string) => candidatesApi.notInterested(id, 'Not a fit'),
    onSuccess: () => {
      toast.success('Candidate moved to rejected')
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })

  const filteredCandidates = useMemo(() => {
    return allCandidates.filter((candidate) => {
      const matchesSearch = `${candidate.name} ${candidate.email} ${candidate.role}`
        .toLowerCase()
        .includes(search.toLowerCase())

      const matchesScope =
        scope === 'all'
          ? true
          : scope === 'inbox'
            ? candidate.inbox_status === 'inbox'
            : candidate.inbox_status === 'pipeline'

      return matchesSearch && matchesScope
    })
  }, [allCandidates, scope, search])

  const inboxCount = allCandidates.filter((candidate) => candidate.inbox_status === 'inbox').length
  const pipelineCount = allCandidates.filter((candidate) => candidate.inbox_status === 'pipeline').length
  const rejectedCount = allCandidates.filter((candidate) => candidate.inbox_status === 'rejected').length

  const renderList = (candidates: Candidate[]) => {
    if (candidates.length === 0) {
      return (
        <div className="rounded-2xl border border-dashed border-border bg-surface p-10 text-center">
          <p className="font-medium">No candidates found</p>
          <p className="mt-1 text-sm text-muted-foreground">Try a different scope or search term</p>
        </div>
      )
    }

    return (
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        {candidates.map((candidate) => (
          <CandidateCard
            key={candidate.id}
            candidate={candidate}
            onApprove={(id) => moveToPipelineMutation.mutate(id)}
            onReject={(id) => notInterestedMutation.mutate(id)}
          />
        ))}
      </div>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <h1 className="font-[Syne] text-2xl font-bold text-foreground">Candidates</h1>
            <p className="text-muted-foreground">Review inbox candidates or inspect the pipeline board</p>
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Search candidates..."
                className="w-[260px] pl-9"
              />
            </div>
            <div className="flex rounded-xl border border-border bg-surface p-1">
              {[
                { key: 'inbox', label: `Inbox (${inboxCount})`, icon: Inbox },
                { key: 'pipeline', label: `Pipeline (${pipelineCount})`, icon: List },
                { key: 'all', label: `All (${allCandidates.length})`, icon: Grid2x2 },
              ].map((item) => {
                const Icon = item.icon
                const active = scope === item.key
                return (
                  <Button
                    key={item.key}
                    type="button"
                    variant="ghost"
                    onClick={() => setScope(item.key as any)}
                    className={cn('gap-2', active && 'bg-primary text-primary-foreground hover:bg-primary')}
                  >
                    <Icon className="h-4 w-4" />
                    {item.label}
                  </Button>
                )
              })}
            </div>
            <div className="flex rounded-xl border border-border bg-surface p-1">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setViewMode('list')}
                className={cn(viewMode === 'list' && 'bg-surface-2')}
              >
                <List className="mr-2 h-4 w-4" />
                List
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setViewMode('board')}
                className={cn(viewMode === 'board' && 'bg-surface-2')}
              >
                <Grid2x2 className="mr-2 h-4 w-4" />
                Board
              </Button>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-2">
          <Badge variant="secondary">Inbox {inboxCount}</Badge>
          <Badge variant="secondary">Pipeline {pipelineCount}</Badge>
          <Badge variant="secondary">Rejected {rejectedCount}</Badge>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {Array.from({ length: 6 }).map((_, index) => (
              <Skeleton key={index} className="h-64 bg-surface-2" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            Failed to load candidates.
            <Button variant="link" onClick={() => refetch()} className="px-2">
              Retry
            </Button>
          </div>
        ) : viewMode === 'board' ? (
          <PipelineBoard roleId="all" stages={defaultStages} />
        ) : (
          renderList(filteredCandidates)
        )}
      </div>
    </AppShell>
  )
}

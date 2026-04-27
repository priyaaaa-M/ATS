'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Filter, Grid, List } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/app-shell'
import { CandidateCard } from '@/components/candidates/candidate-card'
import { SwipeableCards } from '@/components/candidates/swipeable-cards'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { candidatesApi } from '@/lib/api/candidates'
import { useAuthStore } from '@/lib/store/auth-store'
import type { Candidate } from '@/lib/types'
import { cn } from '@/lib/utils'

export default function InterviewerCandidatesPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'cards'>('grid')
  const { data: candidates = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['interviewer-candidates'],
    queryFn: () => candidatesApi.list(),
  })

  const advanceMutation = useMutation({
    mutationFn: candidatesApi.advanceToNextRound,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['interviewer-candidates'] })
      toast.success('Candidate advanced to next round')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to advance candidate')
    },
  })

  const filteredCandidates = useMemo(() => candidates.filter(c =>
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.role.toLowerCase().includes(searchQuery.toLowerCase())
  ), [candidates, searchQuery])

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-[Syne] text-2xl font-bold text-foreground flex items-center gap-3">
              My Candidates
              <Badge className="bg-primary text-primary-foreground">
                {candidates.length}
              </Badge>
            </h1>
            <p className="text-muted-foreground">Candidates assigned to you for interviews</p>
          </div>

          {/* Desktop Controls */}
          <div className="hidden md:flex items-center gap-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-64 bg-surface-2 border-border"
              />
            </div>
            <Button variant="outline" className="border-border">
              <Filter className="mr-2 h-4 w-4" />
              Filters
            </Button>
            <div className="flex border border-border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-none',
                  viewMode === 'grid' && 'bg-surface-2'
                )}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-none',
                  viewMode === 'cards' && 'bg-surface-2'
                )}
                onClick={() => setViewMode('cards')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Mobile Search */}
          <div className="md:hidden">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 bg-surface-2 border-border"
              />
            </div>
          </div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 bg-surface-2" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            Failed to load assigned candidates.
            <Button variant="link" onClick={() => refetch()} className="px-2">
              Retry
            </Button>
          </div>
        )}

        {/* Content */}
        {!isLoading && !isError && (
          <>
            {/* Mobile: Always show swipeable cards at 375px */}
            <div className="block md:hidden">
              <SwipeableCards
                candidates={filteredCandidates}
                onApprove={(id) => advanceMutation.mutate(id)}
                onReject={() => {}}
              />
            </div>

            {/* Desktop: Grid or Table view */}
            <div className="hidden md:block">
              {viewMode === 'grid' ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {filteredCandidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onApprove={(id) => advanceMutation.mutate(id)}
                    />
                  ))}
                </div>
              ) : (
                <div className="space-y-3">
                  {filteredCandidates.map((candidate) => (
                    <CandidateCard
                      key={candidate.id}
                      candidate={candidate}
                      onApprove={(id) => advanceMutation.mutate(id)}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Empty State */}
            {filteredCandidates.length === 0 && (
              <div className="text-center py-12">
                <p className="text-muted-foreground">No candidates found</p>
              </div>
            )}
          </>
        )}
      </div>
    </AppShell>
  )
}

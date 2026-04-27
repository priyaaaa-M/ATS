'use client'

import { useQuery } from '@tanstack/react-query'
import { CheckCircle2, Mail, Download } from 'lucide-react'
import { AppShell } from '@/components/layout/app-shell'
import { CandidateCard } from '@/components/candidates/candidate-card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { candidatesApi } from '@/lib/api/candidates'
import type { Candidate } from '@/lib/types'

export default function SelectedPage() {
  const { data: candidates = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['selected-candidates'],
    queryFn: () => candidatesApi.list({ status: 'selected' }),
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-[Syne] text-2xl font-bold text-foreground flex items-center gap-3">
              <CheckCircle2 className="h-6 w-6 text-success" />
              Selected Candidates
              <Badge className="bg-success text-white">
                {candidates.length}
              </Badge>
            </h1>
            <p className="text-muted-foreground">Candidates who have been selected for hire</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" className="border-border">
              <Download className="mr-2 h-4 w-4" />
              Export
            </Button>
            <Button className="bg-primary text-primary-foreground">
              <Mail className="mr-2 h-4 w-4" />
              Send Offers
            </Button>
          </div>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 3 }).map((_, i) => (
              <Skeleton key={i} className="h-64 bg-surface-2" />
            ))}
          </div>
        ) : isError ? (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            Failed to load selected candidates.
            <Button variant="link" onClick={() => refetch()} className="px-2">
              Retry
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {candidates.map((candidate) => (
              <CandidateCard key={candidate.id} candidate={candidate} />
            ))}
          </div>
        )}

        {!isLoading && !isError && candidates.length === 0 && (
          <div className="text-center py-12">
            <CheckCircle2 className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No selected candidates yet</p>
          </div>
        )}
      </div>
    </AppShell>
  )
}

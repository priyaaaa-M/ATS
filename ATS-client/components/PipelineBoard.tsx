'use client'

import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { ScrollArea } from '@/components/ui/scroll-area'
import { candidatesApi } from '@/lib/api'
import type { Candidate, InterviewStage } from '@/lib/types'
import { cn } from '@/lib/utils'

interface PipelineBoardProps {
  roleId: string
  stages: InterviewStage[]
}

export function PipelineBoard({ roleId, stages }: PipelineBoardProps) {
  const queryClient = useQueryClient()
  const { data: candidates = [] } = useQuery({
    queryKey: ['pipeline-board-candidates', roleId],
    queryFn: () => candidatesApi.list(roleId === 'all' ? {} : { role: roleId }),
  })
  const [localCandidates, setLocalCandidates] = useState<Candidate[]>([])
  const [draggedId, setDraggedId] = useState<string | null>(null)

  useEffect(() => {
    setLocalCandidates(candidates)
  }, [candidates])

  const orderedStages = useMemo(
    () =>
      [...stages].sort((a, b) => (a.order || 0) - (b.order || 0)).map((stage) => stage.name),
    [stages]
  )

  const moveStageMutation = useMutation({
    mutationFn: ({ id, stageName }: { id: string; stageName: string }) =>
      candidatesApi.moveStage(id, stageName),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-board-candidates', roleId] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: () => {
      queryClient.invalidateQueries({ queryKey: ['pipeline-board-candidates', roleId] })
    },
  })

  const stageCandidates = (stageName: string) =>
    localCandidates.filter((candidate) => {
      if (stageName === 'Inbox') return candidate.inbox_status === 'inbox'
      if (stageName === 'Rejected') return candidate.inbox_status === 'rejected'
      return candidate.current_stage === stageName
    })

  const handleDrop = (candidateId: string, stageName: string) => {
    setLocalCandidates((current) =>
      current.map((candidate) =>
        candidate.id === candidateId
          ? { ...candidate, current_stage: stageName, inbox_status: 'pipeline' }
          : candidate
      )
    )
    moveStageMutation.mutate({ id: candidateId, stageName })
  }

  const columns = Array.from(new Set(['Inbox', ...orderedStages, 'Rejected']))

  return (
    <div className="rounded-2xl border border-border bg-surface p-4">
      <div className="mb-4 flex items-center justify-between">
        <div>
          <h3 className="font-[Syne] text-lg font-semibold">Pipeline Board</h3>
          <p className="text-sm text-muted-foreground">Drag candidates between stages</p>
        </div>
        <Badge variant="secondary">{localCandidates.length} candidates</Badge>
      </div>

      <div className="flex gap-4 overflow-x-auto pb-2">
        {columns.map((stageName) => {
          const items = stageCandidates(stageName)
          return (
            <div
              key={stageName}
              onDragOver={(event) => event.preventDefault()}
              onDrop={(event) => {
                event.preventDefault()
                if (draggedId) {
                  handleDrop(draggedId, stageName)
                }
              }}
              className={cn(
                'min-w-[280px] rounded-2xl border border-border bg-surface-2',
                stageName === 'Hired' && 'ring-1 ring-success/30'
              )}
            >
              <div className="flex items-center justify-between border-b border-border px-4 py-3">
                <div>
                  <p className="font-medium">{stageName}</p>
                  <p className="text-xs text-muted-foreground">{items.length} candidates</p>
                </div>
                <Badge variant="secondary">{items.length}</Badge>
              </div>
              <ScrollArea className="h-[520px]">
                <div className="space-y-3 p-3">
                  {items.map((candidate) => (
                    <div
                      key={candidate.id}
                      draggable
                      onDragStart={() => setDraggedId(candidate.id)}
                      onDragEnd={() => setDraggedId(null)}
                      className="w-full rounded-xl border border-border bg-surface p-3 text-left transition hover:border-primary/40"
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-semibold">{candidate.name}</p>
                          <p className="text-xs text-muted-foreground">{candidate.role}</p>
                        </div>
                        <Badge variant="outline">{candidate.match_score || candidate.ats_score || 0}</Badge>
                      </div>
                      <p className="mt-2 text-xs text-muted-foreground">
                        Stage: {candidate.current_stage || candidate.inbox_status || 'Inbox'}
                      </p>
                      <div className="mt-3 flex gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          className="h-8 flex-1"
                          onClick={() => handleDrop(candidate.id, stageName)}
                        >
                          Move Here
                        </Button>
                      </div>
                    </div>
                  ))}
                  {items.length === 0 ? (
                    <div className="rounded-xl border border-dashed border-border p-4 text-center text-sm text-muted-foreground">
                      No candidates here yet
                    </div>
                  ) : null}
                </div>
              </ScrollArea>
            </div>
          )
        })}
      </div>
    </div>
  )
}

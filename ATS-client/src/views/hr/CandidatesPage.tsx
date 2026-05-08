import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Search, Users } from 'lucide-react'
import { candidatesApi, rolesApi, roundsApi } from '../../api'
import { CandidateSlidePanel } from '../../components/candidates/CandidateSlidePanel'
import { PipelineBoard } from '../../components/pipeline/PipelineBoard'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { cn } from '../../lib/utils'

function stringToColor(str: string) {
  const colors = ['#EC5B24', '#387DF1', '#0FA596', '#8B5CF6', '#DDA615', '#22A268', '#DB3232']
  let hash = 0
  for (let index = 0; index < str.length; index += 1) {
    hash = str.charCodeAt(index) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

export function CandidatesPage() {
  const queryClient = useQueryClient()
  const [statusFilter, setStatusFilter] = useState('inbox')
  const [roleFilter, setRoleFilter] = useState('all')
  const [pipelineRole, setPipelineRole] = useState('')
  const [search, setSearch] = useState('')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)

  const filters = useMemo(
    () => ({ activeStatus: statusFilter, activeRole: roleFilter, search }),
    [statusFilter, roleFilter, search]
  )

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['candidates', filters],
    queryFn: () =>
      candidatesApi.list({
        inboxStatus: statusFilter === 'all' ? undefined : statusFilter,
        role: roleFilter === 'all' ? undefined : roleFilter,
        search: search || undefined,
      }),
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
  })

  useEffect(() => {
    if (!pipelineRole && roles[0]?.name) {
      setPipelineRole(roles[0].name)
    }
  }, [pipelineRole, roles])

  const { data: roleRounds = [] } = useQuery({
    queryKey: ['rounds', pipelineRole],
    queryFn: () => roundsApi.listByRole(pipelineRole),
    enabled: !!pipelineRole,
  })

  const { data: counts } = useQuery({
    queryKey: ['candidate-counts'],
    queryFn: () => candidatesApi.getCounts(),
  })

  const { data: pipelineData, isLoading: isLoadingPipeline } = useQuery({
    queryKey: ['pipeline', pipelineRole],
    queryFn: () => candidatesApi.getPipeline(pipelineRole),
    enabled: statusFilter === 'pipeline' && !!pipelineRole,
  })

  const panelCandidates =
    statusFilter === 'pipeline'
      ? [...(pipelineData?.inboxCandidates || []), ...(pipelineData?.pipelineCandidates || [])]
      : candidates

  const selectedCandidate =
    selectedIndex !== null ? panelCandidates[selectedIndex] ?? null : null

  const moveCandidate = useMutation({
    mutationFn: ({
      candidateId,
      newStageId,
    }: {
      candidateId: string
      newStageId: string
    }) => candidatesApi.moveToStage(candidateId, newStageId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates', filters] })
      queryClient.invalidateQueries({ queryKey: ['pipeline', pipelineRole] })
    },
  })

  const openCandidate = (index: number) => {
    setSelectedIndex(index)
    window.history.replaceState(null, '', `?candidate=${panelCandidates[index].id}`)
  }

  useEffect(() => {
    const candidateId = new URLSearchParams(window.location.search).get('candidate')
    if (!candidateId) return
    const index = panelCandidates.findIndex((candidate) => candidate.id === candidateId)
    if (index >= 0) setSelectedIndex(index)
  }, [panelCandidates])

  return (
    <div className="flex h-full min-h-0 flex-col">
      <div className="flex-shrink-0 border-b border-border bg-card px-8 py-6">
        <h1 className="text-xl font-semibold">Candidates</h1>
      </div>

      <div className="flex flex-shrink-0 items-center gap-3 border-b border-border px-8 py-3">
        <Select value={roleFilter} onValueChange={setRoleFilter}>
          <SelectTrigger className="h-8 w-48 text-sm">
            <SelectValue placeholder="All Roles" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Roles</SelectItem>
            {roles.map((role) => (
              <SelectItem key={role.id} value={role.name}>
                {role.name} ({role.candidateCount || 0})
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <div className="flex gap-2">
          {[
            { key: 'inbox', label: 'Inbox', count: counts?.inbox || 0 },
            { key: 'pipeline', label: 'Pipeline', count: counts?.pipeline || 0 },
            { key: 'all', label: 'All', count: counts?.all || 0 },
          ].map((status) => (
            <button
              key={status.key}
              onClick={() => setStatusFilter(status.key)}
              className={cn(
                'rounded-full border px-3 py-1.5 text-xs font-medium transition-all',
                statusFilter === status.key
                  ? 'border-primary bg-primary text-white'
                  : 'border-border text-muted-foreground'
              )}
            >
              {status.label}
              {status.count > 0 && <span className="ml-1">{status.count}</span>}
            </button>
          ))}
        </div>

        <div className="flex-1" />

        <div className="relative">
          <Search className="absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search candidates..."
            className="h-8 w-52 pl-8 text-sm"
          />
        </div>

        <Button size="sm" className="h-8">
          + Add Candidate
        </Button>
      </div>

      <div className="min-h-0 flex-1 overflow-y-auto">
        {statusFilter === 'pipeline' ? (
          <div className="p-6">
            <div className="mb-4">
              <Select value={pipelineRole} onValueChange={setPipelineRole}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Select role..." />
                </SelectTrigger>
                <SelectContent>
                  {roles.map((role) => (
                    <SelectItem key={role.id} value={role.name}>
                      {role.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <PipelineBoard
              rounds={roleRounds}
              inboxCandidates={pipelineData?.inboxCandidates || []}
              pipelineCandidates={pipelineData?.pipelineCandidates || []}
              isLoading={isLoadingPipeline}
              onOpen={(selectedPipelineCandidate) => {
                const index = panelCandidates.findIndex(
                  (candidate) => candidate.id === selectedPipelineCandidate.id
                )
                if (index >= 0) openCandidate(index)
              }}
              onMove={(candidateId, newStageId) => {
                queryClient.setQueryData<any[]>(['candidates', filters], (old = []) =>
                  old.map((item) =>
                    item.id === candidateId ? { ...item, currentStageId: newStageId } : item
                  )
                )
                moveCandidate.mutate({ candidateId, newStageId })
              }}
            />
          </div>
        ) : isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
          </div>
        ) : candidates.length === 0 ? (
          <div className="flex h-64 flex-col items-center justify-center text-muted-foreground">
            <Users className="mb-3 h-10 w-10 opacity-30" />
            <p className="text-sm font-medium">No candidates here</p>
            <p className="mt-1 text-xs">
              {statusFilter === 'inbox'
                ? 'Sync Drive to import resumes'
                : 'Approve candidates to add them to the pipeline'}
            </p>
          </div>
        ) : (
          candidates.map((candidate, index) => (
            <div
              key={candidate.id}
              onClick={() => openCandidate(index)}
              className="flex cursor-pointer items-center gap-4 border-b border-border px-8 py-4 transition-colors hover:bg-muted/30"
            >
              <div
                className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                style={{ background: stringToColor(candidate.name || 'AT') }}
              >
                {candidate.name?.slice(0, 2).toUpperCase() || '??'}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold">{candidate.name}</p>
                <p className="truncate text-xs text-muted-foreground">
                  {candidate.candidateEmail}
                </p>
              </div>
              <div className="hidden w-40 md:block">
                <p className="truncate text-sm text-muted-foreground">{candidate.role}</p>
              </div>
              <div className="hidden w-20 lg:block">
                {candidate.atsScore !== null && candidate.atsScore !== undefined && (
                  <span
                    className={cn(
                      'rounded px-2 py-1 text-xs font-bold',
                      candidate.atsScore >= 75
                        ? 'bg-green-500/15 text-green-500'
                        : candidate.atsScore >= 50
                          ? 'bg-yellow-500/15 text-yellow-500'
                          : 'bg-red-500/15 text-red-500'
                    )}
                  >
                    {candidate.atsScore}%
                  </span>
                )}
              </div>
              <div className="w-28">
                <Badge
                  variant="outline"
                  className={cn(
                    'text-xs',
                    candidate.status === 'hr_approved' && 'border-blue-500/50 text-blue-500',
                    candidate.status === 'scheduled' && 'border-green-500/50 text-green-500',
                    candidate.status === 'selected' && 'border-purple-500/50 text-purple-500',
                    candidate.status === 'rejected' &&
                      'border-red-500/50 text-red-500 opacity-60'
                  )}
                >
                  {candidate.status?.replace('_', ' ')}
                </Badge>
              </div>
              <div className="hidden w-20 text-right xl:block">
                <p className="text-xs text-muted-foreground">
                  {formatDistanceToNow(new Date(candidate.createdAt))} ago
                </p>
              </div>
            </div>
          ))
        )}
      </div>

      <CandidateSlidePanel
        open={Boolean(selectedCandidate)}
        candidate={selectedCandidate}
        candidates={panelCandidates}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        filters={filters}
      />
    </div>
  )
}

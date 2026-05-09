import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { motion } from 'framer-motion'
import { formatDistanceToNow } from 'date-fns'
import { Loader2, Search, Users, MoreVertical, ChevronLeft, ChevronRight, Upload } from 'lucide-react'
import { candidatesApi, rolesApi, roundsApi } from '../../api'
import { CandidateSlidePanel } from '../../components/candidates/CandidateSlidePanel'
import { BulkUploadModal } from '../../components/candidates/BulkUploadModal'
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
  const [bulkUploadOpen, setBulkUploadOpen] = useState(false)

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
      <div className="flex-shrink-0 px-8 py-6 pb-2">
        <h1 className="text-2xl font-bold text-foreground tracking-tight">Candidates</h1>
        <p className="text-sm text-muted-foreground mt-1">Manage and track all candidates in your pipeline.</p>
      </div>

      <div className="flex flex-shrink-0 flex-col gap-4 lg:flex-row lg:items-center justify-between px-8 py-4">
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full lg:w-auto">
          <Select value={roleFilter} onValueChange={setRoleFilter}>
            <SelectTrigger className="h-10 w-full sm:w-48 text-sm bg-transparent border-border rounded-xl focus:ring-brand/30">
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

          <div className="flex items-center rounded-xl border border-border p-1 bg-card w-full sm:w-auto overflow-x-auto">
            {[
              { key: 'all', label: 'All', count: counts?.all || 0 },
              { key: 'inbox', label: 'Inbox', count: counts?.inbox || 0 },
              { key: 'pipeline', label: 'Pipeline', count: counts?.pipeline || 0 },
              { key: 'paused', label: 'Paused', count: counts?.paused || 0 },
            ].map((status) => (
              <button
                key={status.key}
                onClick={() => setStatusFilter(status.key)}
                className={cn(
                  'flex flex-1 sm:flex-none items-center justify-center gap-2 rounded-lg px-4 py-1.5 text-xs font-medium transition-all whitespace-nowrap',
                  statusFilter === status.key
                    ? 'bg-muted text-foreground shadow-sm'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                )}
              >
                {status.label}
                {status.count > 0 && (
                  <span className={cn(
                    "rounded-md px-1.5 py-0.5 text-[10px] font-bold border border-border/50",
                    statusFilter === status.key ? "bg-background text-foreground shadow-sm" : "bg-muted text-muted-foreground"
                  )}>{status.count}</span>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-3 w-full lg:w-auto">
          <div className="relative flex-1 lg:flex-none">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search candidates..."
              className="h-10 w-full lg:w-64 pl-9 text-sm bg-transparent border-border rounded-xl focus-visible:ring-brand/30"
            />
          </div>
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => setBulkUploadOpen(true)}
            className="h-10 rounded-xl border-border hover:bg-muted text-sm px-4"
          >
            <Upload className="w-3.5 h-3.5 mr-1.5"/>
            Bulk Upload
          </Button>
          <Button size="sm" className="h-10 rounded-xl btn-primary-glow px-4 flex-shrink-0">
            + Add Candidate
          </Button>
        </div>
      </div>

      <div className="min-h-0 flex-1 px-8 pb-8">
        {statusFilter === 'pipeline' ? (
          <div className="h-full rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
            <div className="p-4 border-b border-border bg-muted/20">
              <Select value={pipelineRole} onValueChange={setPipelineRole}>
                <SelectTrigger className="w-[280px] bg-card border-border text-foreground rounded-lg">
                  <SelectValue placeholder="Select role to view pipeline" />
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

            <div className="flex-1 overflow-y-auto">
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
          </div>
        ) : (
          <div className="h-full rounded-2xl border border-border bg-card shadow-sm flex flex-col overflow-hidden">
            {/* Table Header */}
            <div className="grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_auto] items-center gap-4 border-b border-border bg-muted/20 px-6 py-3">
              <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Candidate</div>
              <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Role</div>
              <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Stage</div>
              <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">ATS Score</div>
              <div className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">Added</div>
              <div className="w-8"></div>
            </div>

            {/* Table Body */}
            <div className="flex-1 overflow-y-auto">
              {isLoading ? (
                <div className="flex h-full items-center justify-center">
                  <Loader2 className="h-8 w-8 animate-spin text-brand" />
                </div>
              ) : candidates.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center text-muted-foreground">
                  <Users className="mb-4 h-12 w-12 opacity-20 text-brand" />
                  <p className="text-lg font-semibold text-foreground">No candidates here</p>
                  <p className="mt-2 text-sm text-center max-w-sm">
                    {statusFilter === 'inbox'
                      ? 'Sync Drive to import resumes or click Add Candidate.'
                      : 'Try adjusting your search or filters.'}
                  </p>
                </div>
              ) : (
                candidates.map((candidate, index) => (
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ duration: 0.2, delay: index * 0.02 }}
                    key={candidate.id}
                    onClick={() => openCandidate(index)}
                    className="group grid grid-cols-[2fr_1.5fr_1fr_1fr_1.5fr_auto] items-center gap-4 border-b border-border/50 px-6 py-4 cursor-pointer hover:bg-muted/30 transition-colors last:border-0 relative"
                  >
                    <div className="absolute left-0 top-0 bottom-0 w-0.5 bg-brand opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="flex items-center gap-4 min-w-0">
                      <div
                        className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-[13px] font-bold text-white shadow-inner"
                        style={{ background: `linear-gradient(135deg, ${stringToColor(candidate.name || 'AT')} 0%, ${stringToColor(candidate.name || 'AT')}dd 100%)` }}
                      >
                        {candidate.name?.slice(0, 2).toUpperCase() || '??'}
                      </div>
                      <div className="min-w-0">
                        <p className="truncate text-sm font-semibold text-foreground group-hover:text-brand transition-colors">{candidate.name}</p>
                        <p className="truncate text-xs text-muted-foreground mt-0.5">{candidate.candidateEmail}</p>
                      </div>
                    </div>
                    
                    <div className="min-w-0">
                      <p className="truncate text-sm text-muted-foreground">{candidate.role}</p>
                    </div>
                    
                    <div>
                      <Badge
                        variant="outline"
                        className={cn(
                          'text-xs py-1 px-2.5 rounded-lg w-fit capitalize font-medium flex items-center gap-1.5 border-0 shadow-sm',
                          candidate.status === 'scheduled' ? 'bg-purple-500/10 text-purple-500 dark:text-purple-400' :
                          candidate.status === 'pending' ? 'bg-blue-500/10 text-blue-500 dark:text-blue-400' :
                          candidate.status === 'selected' ? 'bg-emerald-500/10 text-emerald-500 dark:text-emerald-400' :
                          candidate.status === 'hr_approved' ? 'bg-amber-500/10 text-amber-600 dark:text-amber-500' :
                          candidate.status === 'maybe_later' ? 'bg-indigo-500/10 text-indigo-500 dark:text-indigo-400' :
                          'bg-muted text-muted-foreground'
                        )}
                      >
                        <div className={cn("w-1.5 h-1.5 rounded-full", 
                          candidate.status === 'scheduled' ? 'bg-purple-500 dark:bg-purple-400' :
                          candidate.status === 'pending' ? 'bg-blue-500 dark:bg-blue-400' :
                          candidate.status === 'selected' ? 'bg-emerald-500 dark:bg-emerald-400' :
                          candidate.status === 'hr_approved' ? 'bg-amber-500 dark:bg-amber-400' :
                          candidate.status === 'maybe_later' ? 'bg-indigo-500 dark:bg-indigo-400' :
                          'bg-muted-foreground'
                        )} />
                        {candidate.status === 'scheduled' ? 'Interview' :
                         candidate.status === 'pending' ? 'Screening' :
                         candidate.status === 'selected' ? 'Offer' :
                         candidate.status === 'hr_approved' ? 'Assessment' :
                         candidate.status === 'maybe_later' ? 'Paused' :
                         candidate.status?.replace('_', ' ')}
                      </Badge>
                    </div>
                    
                    <div>
                      {candidate.atsScore !== null && candidate.atsScore !== undefined ? (
                        <span className={cn("text-sm font-semibold", 
                          candidate.atsScore >= 75 ? 'text-emerald-500' : 
                          candidate.atsScore >= 50 ? 'text-amber-500' : 
                          'text-rose-500'
                        )}>
                          {candidate.atsScore}%
                        </span>
                      ) : (
                        <span className="text-sm text-muted-foreground">-</span>
                      )}
                    </div>
                    
                    <div>
                      <p className="text-sm text-muted-foreground">
                        {formatDistanceToNow(new Date(candidate.createdAt))} ago
                      </p>
                    </div>
                    
                    <div className="flex justify-end">
                      <button className="text-muted-foreground hover:text-foreground transition-colors p-1.5 rounded-md hover:bg-muted" onClick={(e) => { e.stopPropagation(); openCandidate(index); }}>
                        <MoreVertical className="h-4 w-4" />
                      </button>
                    </div>
                  </motion.div>
                ))
              )}
            </div>

            {/* Pagination Footer */}
            {!isLoading && candidates.length > 0 && (
              <div className="border-t border-border bg-muted/10 p-3 flex items-center justify-center gap-1">
                <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"><ChevronLeft className="h-4 w-4" /></button>
                <button className="h-7 w-7 rounded-md bg-muted text-foreground text-xs font-semibold">1</button>
                <button className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted text-xs font-medium">2</button>
                <button className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted text-xs font-medium">3</button>
                <span className="px-2 text-muted-foreground text-xs">...</span>
                <button className="h-7 w-7 rounded-md text-muted-foreground hover:bg-muted text-xs font-medium">12</button>
                <button className="p-1 rounded text-muted-foreground hover:text-foreground hover:bg-muted"><ChevronRight className="h-4 w-4" /></button>
              </div>
            )}
          </div>
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

      <BulkUploadModal
        open={bulkUploadOpen}
        onClose={() => setBulkUploadOpen(false)}
        roles={roles}
      />
    </div>
  )
}

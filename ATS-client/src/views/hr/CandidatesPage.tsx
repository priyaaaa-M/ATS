import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { candidatesApi, roundsApi, rolesApi } from '../../api'
import { CandidateSlidePanel } from '../../components/candidates/CandidateSlidePanel'
import { AddCandidateModal } from '../../components/candidates/AddCandidateModal'
import { CandidateRow } from '../../components/candidates/CandidateRow'
import { PipelineBoard } from '../../components/pipeline/PipelineBoard'
import { EmptyState } from '../../components/shared/EmptyState'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useCandidates } from '../../hooks/useCandidates'

export function CandidatesPage() {
  const qc = useQueryClient()
  const [params, setParams] = useSearchParams()
  const [addOpen, setAddOpen] = useState(false)
  const role = params.get('role') ?? 'all'
  const view = params.get('view') ?? 'inbox'
  const candidateId = params.get('candidate')
  const search = params.get('search') ?? ''
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list })
  const { data: stages = [] } = useQuery({ queryKey: ['stages'], queryFn: () => roundsApi.list(role === 'all' ? roles[0]?.name ?? '' : role), enabled: roles.length > 0 })
  const filters = { role: role === 'all' ? undefined : role, inboxStatus: view === 'all' ? undefined : view }
  const { data: candidates = [] } = useCandidates(filters)
  const filtered = useMemo(() => {
    const searchValue = search.trim().toLowerCase()
    if (!searchValue) return candidates

    return candidates.filter((candidate) => {
      const candidateName = String(candidate.name ?? '').toLowerCase()
      const candidateEmail = String(candidate.candidateEmail ?? '').toLowerCase()
      return candidateName.includes(searchValue) || candidateEmail.includes(searchValue)
    })
  }, [candidates, search])
  const moveStage = useMutation({
    mutationFn: ({ id, stageName }: { id: string; stageName: string }) => candidatesApi.moveStage(id, stageName),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  })

  return (
    <div className="space-y-6">
      <PageHeader title="Candidates" actions={<Button onClick={() => setAddOpen(true)}><UserPlus className="h-4 w-4" /> Add Candidate</Button>} />
      <div className="scrollbar-thin flex gap-4 overflow-x-auto border-b pb-2">
        <button className={`pb-2 text-sm ${role === 'all' ? 'border-b-2 border-[var(--brand)] text-[var(--brand)]' : 'text-[var(--text-3)]'}`} onClick={() => setParams((current) => { current.set('role', 'all'); return current })}>All Roles</button>
        {roles.map((item) => <button key={item.id} className={`whitespace-nowrap pb-2 text-sm ${role === item.name ? 'border-b-2 border-[var(--brand)] text-[var(--brand)]' : 'text-[var(--text-3)]'}`} onClick={() => setParams((current) => { current.set('role', item.name); return current })}>{item.title} ({item.candidateCount ?? 0})</button>)}
      </div>
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div className="flex gap-2">
          {['inbox', 'pipeline', 'all'].map((option) => <button key={option} className={`rounded-full px-4 py-2 text-sm ${view === option ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-card)] text-[var(--text-2)] border'}`} onClick={() => setParams((current) => { current.set('view', option); return current })}>{option[0].toUpperCase() + option.slice(1)}</button>)}
        </div>
        <div className="relative w-full md:w-[280px]">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--text-3)]" />
          <Input value={search} onChange={(e) => setParams((current) => { current.set('search', e.target.value); return current })} className="pl-9" placeholder="Search by name or email" />
        </div>
      </div>
      {view === 'pipeline' ? (
        <PipelineBoard stages={stages} candidates={filtered} onMove={(id, stageName) => moveStage.mutate({ id, stageName })} />
      ) : filtered.length ? (
        <div className="rounded-[14px] border bg-[var(--bg-card)] p-2">
          {filtered.map((candidate) => <CandidateRow key={candidate.id} candidate={candidate} onClick={() => setParams((current) => { current.set('candidate', candidate.id); return current })} />)}
        </div>
      ) : (
        <EmptyState icon={UserPlus} title="No candidates found" description="Try a different role filter or search term." />
      )}
      <CandidateSlidePanel
        open={Boolean(candidateId)}
        candidateId={candidateId}
        candidates={filtered}
        onClose={() => setParams((current) => { current.delete('candidate'); return current })}
        onNavigate={(id) => setParams((current) => { current.set('candidate', id); return current })}
      />
      <AddCandidateModal open={addOpen} onOpenChange={setAddOpen} />
    </div>
  )
}

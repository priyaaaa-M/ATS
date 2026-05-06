import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, UserPlus } from 'lucide-react'
import { useMemo, useState } from 'react'
import { useSearchParams } from 'react-router-dom'
import { candidatesApi, roundsApi, rolesApi } from '../../api'
import { CandidateSlidePanel } from '../../components/candidates/CandidateSlidePanel'
import { AddCandidateModal } from '../../components/candidates/AddCandidateModal'
import { CandidateRow } from '../../components/candidates/CandidateRow'
import { PipelineBoard } from '../../components/pipeline/PipelineBoard'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { useCandidates } from '../../hooks/useCandidates'
import type { InterviewStage } from '../../types'

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
  const pipelineStages = useMemo<InterviewStage[]>(
    () =>
      stages.map((stage) => ({
        id: stage.id,
        name: `Round ${stage.roundNumber}`,
        order: stage.roundNumber,
        duration: 45,
        interviewerName: stage.interviewerName,
        interviewerGmail: stage.interviewerGmail,
        updatedAt: stage.updatedAt,
      })),
    [stages],
  )
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
    <div className="-m-6 min-h-[calc(100vh-48px)] bg-[#f6f8fb] text-[#101828]">
      <div className="bg-white/95 px-8 py-7 shadow-[inset_0_-1px_0_#eef2f6]">
        <div className="mx-auto flex max-w-[1280px] flex-col gap-5 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <p className="text-[12px] font-semibold uppercase tracking-[0.08em] text-[#98a2b3]">Talent workspace</p>
            <h1 className="mt-2 text-[28px] font-semibold tracking-[-0.035em] text-[#0b1220]">Candidates</h1>
            <p className="mt-1 text-[14px] text-[#667085]">Review applicants, manage pipeline stages, and add candidates to active roles.</p>
          </div>
          <Button
            onClick={() => setAddOpen(true)}
            className="h-11 rounded-[8px] bg-[#ec5b24] px-4 text-[13px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.12)] hover:bg-[#dd4f1b]"
          >
            <UserPlus className="h-4 w-4" /> Add Candidate
          </Button>
        </div>

        <div className="mx-auto mt-8 max-w-[1280px]">
          <div className="scrollbar-thin flex gap-1 overflow-x-auto rounded-[10px] bg-[#f8fafc] p-1 ring-1 ring-[#e5e7eb]">
            <button
              className={`h-9 rounded-[7px] px-4 text-[13px] font-semibold transition ${role === 'all' ? 'bg-white text-[#ec5b24] shadow-[0_1px_2px_rgba(16,24,40,0.08)]' : 'text-[#667085] hover:bg-white/70 hover:text-[#101828]'}`}
              onClick={() => setParams((current) => { current.set('role', 'all'); return current })}
            >
              All Roles
            </button>
            {roles.map((item) => (
              <button
                key={item.id}
                className={`h-9 whitespace-nowrap rounded-[7px] px-4 text-[13px] font-semibold transition ${role === item.name ? 'bg-white text-[#ec5b24] shadow-[0_1px_2px_rgba(16,24,40,0.08)]' : 'text-[#667085] hover:bg-white/70 hover:text-[#101828]'}`}
                onClick={() => setParams((current) => { current.set('role', item.name); return current })}
              >
                {item.title} <span className={role === item.name ? 'text-[#f08a66]' : 'text-[#98a2b3]'}>({item.candidateCount ?? 0})</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="mx-auto max-w-[1280px] px-8 py-7">
        <div className="mb-5 rounded-[12px] border border-[#e5e7eb] bg-white p-4 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div className="inline-flex w-fit rounded-[9px] bg-[#f8fafc] p-1 ring-1 ring-[#e5e7eb]">
            {['inbox', 'pipeline', 'all'].map((option) => (
              <button
                key={option}
                className={`h-9 rounded-[7px] px-4 text-[13px] font-semibold transition ${
                  view === option
                    ? 'bg-[#0f172a] text-white shadow-[0_1px_2px_rgba(16,24,40,0.16)]'
                    : 'text-[#667085] hover:bg-[#f8fafc] hover:text-[#101828]'
                }`}
                onClick={() => setParams((current) => { current.set('view', option); return current })}
              >
                {option[0].toUpperCase() + option.slice(1)}
              </button>
            ))}
          </div>
          <div className="relative w-full md:w-[360px]">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[#98a2b3]" />
            <Input
              value={search}
              onChange={(e) => setParams((current) => { current.set('search', e.target.value); return current })}
              className="h-11 rounded-[9px] border-[#d0d5dd] bg-white pl-10 text-[14px] shadow-[0_1px_2px_rgba(16,24,40,0.04)] placeholder:text-[#98a2b3] focus:border-[#667085]"
              placeholder="Search by name or email"
            />
          </div>
          </div>
        </div>

        {view === 'pipeline' ? (
          <PipelineBoard stages={pipelineStages} candidates={filtered} onMove={(id, stageName) => moveStage.mutate({ id, stageName })} />
        ) : filtered.length ? (
          <div className="overflow-hidden rounded-[12px] border border-[#e5e7eb] bg-white shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
            <div className="grid grid-cols-[minmax(260px,1fr)_160px_120px_140px] border-b border-[#e5e7eb] bg-[#f8fafc] px-4 py-3 text-[11px] font-semibold uppercase tracking-[0.04em] text-[#667085]">
              <span>Candidate</span>
              <span>Role</span>
              <span>Score</span>
              <span className="text-right">Stage</span>
            </div>
            <div className="divide-y divide-[#eef0f3]">
              {filtered.map((candidate) => <CandidateRow key={candidate.id} candidate={candidate} onClick={() => setParams((current) => { current.set('candidate', candidate.id); return current })} />)}
            </div>
          </div>
        ) : (
          <div className="flex min-h-[300px] flex-col items-center justify-center rounded-[14px] border border-[#e5e7eb] bg-white px-6 text-center shadow-[0_8px_24px_rgba(16,24,40,0.035)]">
            <div className="flex h-12 w-12 items-center justify-center rounded-[11px] border border-[#e5e7eb] bg-[#f8fafc] text-[#667085] shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
              <UserPlus className="h-5 w-5" />
            </div>
            <h2 className="mt-4 text-[15px] font-semibold text-[#0b1220]">No candidates found</h2>
            <p className="mt-1.5 max-w-[360px] text-[13px] leading-5 text-[#667085]">Try a different role filter or adjust your search. Use Add Candidate when you are ready to add someone manually.</p>
          </div>
        )}
      </div>
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

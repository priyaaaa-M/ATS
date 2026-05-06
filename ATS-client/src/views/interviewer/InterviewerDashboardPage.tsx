import { useSearchParams } from 'react-router-dom'
import { useCandidates } from '../../hooks/useCandidates'
import { CandidateRow } from '../../components/candidates/CandidateRow'
import { CandidateSlidePanel } from '../../components/candidates/CandidateSlidePanel'
import { PageHeader } from '../../components/shared/PageHeader'

export function InterviewerDashboardPage() {
  const [params, setParams] = useSearchParams()
  const candidateId = params.get('candidate')
  const { data: candidates = [] } = useCandidates({})

  return (
    <div className="space-y-6">
      <PageHeader title="My Candidates" description="Assigned interviews and feedback tasks." />
      <div className="rounded-[14px] border bg-[var(--bg-card)] p-2">
        {candidates.map((candidate) => <CandidateRow key={candidate.id} candidate={candidate} onClick={() => setParams((current) => { current.set('candidate', candidate.id); return current })} />)}
      </div>
      <CandidateSlidePanel
        open={Boolean(candidateId)}
        candidateId={candidateId}
        candidates={candidates}
        onClose={() => setParams((current) => { current.delete('candidate'); return current })}
        onNavigate={(id) => setParams((current) => { current.set('candidate', id); return current })}
      />
    </div>
  )
}

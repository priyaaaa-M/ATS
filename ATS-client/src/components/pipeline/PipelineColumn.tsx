import { useDroppable } from '@dnd-kit/core'
import type { Candidate, InterviewStage } from '../../types'
import { KanbanCard } from './KanbanCard'

export function PipelineColumn({ stage, candidates }: { stage: InterviewStage; candidates: Candidate[] }) {
  const { setNodeRef } = useDroppable({ id: stage.name })
  return (
    <div ref={setNodeRef} className="min-w-[260px] rounded-[10px] bg-[var(--bg-page)]">
      <div className="mb-3 flex items-center justify-between rounded-[10px] border bg-[var(--bg-card)] px-4 py-3">
        <p className="text-sm font-semibold">{stage.name}</p>
        <span className="text-xs text-[var(--text-2)]">{candidates.length}</span>
      </div>
      <div className="space-y-3">
        {candidates.map((candidate) => <KanbanCard key={candidate.id} candidate={candidate} />)}
      </div>
    </div>
  )
}

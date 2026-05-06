import { DndContext } from '@dnd-kit/core'
import type { DragEndEvent } from '@dnd-kit/core'
import confetti from 'canvas-confetti'
import type { Candidate, InterviewStage } from '../../types'
import { PipelineColumn } from './PipelineColumn'

export function PipelineBoard({ stages, candidates, onMove }: { stages: InterviewStage[]; candidates: Candidate[]; onMove: (id: string, stageName: string) => void }) {
  const byStage = stages.map((stage) => ({ stage, candidates: candidates.filter((candidate) => candidate.currentStage === stage.name) }))
  return (
    <DndContext
      onDragEnd={(event: DragEndEvent) => {
        const candidateId = String(event.active.id)
        const stageName = event.over?.id ? String(event.over.id) : ''
        if (!stageName) return
        onMove(candidateId, stageName)
        if (stageName.toLowerCase() === 'hired') confetti({ particleCount: 90, spread: 70, origin: { y: 0.6 } })
      }}
    >
      <div className="scrollbar-thin flex gap-4 overflow-x-auto pb-3">
        {byStage.map(({ stage, candidates: items }) => <PipelineColumn key={stage.id ?? stage.name} stage={stage} candidates={items} />)}
      </div>
    </DndContext>
  )
}

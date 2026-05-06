import { useDraggable } from '@dnd-kit/core'
import { CSS } from '@dnd-kit/utilities'
import type { Candidate } from '../../types'
import { Avatar } from '../shared/Avatar'
import { ScoreBadge } from '../candidates/ScoreBadge'

export function KanbanCard({ candidate }: { candidate: Candidate }) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({ id: candidate.id })
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform) }}
      className="rounded-[8px] bg-[var(--bg-card)] p-3 shadow-sm"
      {...listeners}
      {...attributes}
    >
      <div className="flex items-start gap-3">
        <Avatar name={candidate.name} />
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">{candidate.name}</p>
          <p className="truncate text-xs text-[var(--text-2)]">{candidate.parsedData?.headline ?? candidate.role}</p>
        </div>
      </div>
      <div className="mt-3 flex items-center justify-between">
        <ScoreBadge score={candidate.atsScore} />
        <span className="text-[11px] text-[var(--text-2)]">{candidate.currentStage ?? 'Stage'}</span>
      </div>
    </div>
  )
}

import {
  DndContext,
  closestCenter,
  useDraggable,
  useDroppable,
  type DragEndEvent,
} from '@dnd-kit/core'
import confetti from 'canvas-confetti'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useMemo } from 'react'
import type { Candidate, InterviewRound } from '../../types'
import { cn } from '../../lib/utils'

function stringToColor(str: string) {
  const colors = ['#EC5B24', '#387DF1', '#0FA596', '#8B5CF6', '#DDA615', '#22A268', '#DB3232']
  let hash = 0
  for (let index = 0; index < str.length; index += 1) {
    hash = str.charCodeAt(index) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function KanbanCard({
  candidate,
  onOpen,
}: {
  candidate: Candidate
  onOpen: () => void
}) {
  const { attributes, listeners, setNodeRef, transform } = useDraggable({
    id: candidate.id,
  })

  return (
    <div
      ref={setNodeRef}
      {...listeners}
      {...attributes}
      onClick={onOpen}
      style={{
        transform: transform
          ? `translate3d(${transform.x}px, ${transform.y}px, 0)`
          : undefined,
      }}
      className="mb-2 cursor-grab rounded-lg border border-border bg-card p-3 transition-all hover:border-primary/50 hover:shadow-sm active:cursor-grabbing"
    >
      <div className="mb-2 flex items-center gap-2">
        <div
          className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white"
          style={{ background: stringToColor(candidate.name || 'AT') }}
        >
          {candidate.name?.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <p className="truncate text-xs font-semibold">{candidate.name}</p>
        </div>
      </div>
      <p className="mb-2 truncate text-xs text-muted-foreground">{candidate.role}</p>
      <div className="flex items-center justify-between">
        {candidate.assignedInterviewerEmail && (
          <div className="flex items-center gap-1">
            <div className="flex h-4 w-4 items-center justify-center rounded-full bg-primary text-[8px] font-bold text-white">
              {candidate.assignedInterviewerEmail.charAt(0).toUpperCase()}
            </div>
            <span className="max-w-[80px] truncate text-[10px] text-muted-foreground">
              {candidate.assignedInterviewerEmail.split('@')[0]}
            </span>
          </div>
        )}
        {candidate.atsScore && (
          <span
            className={cn(
              'text-[10px] font-bold',
              candidate.atsScore >= 75
                ? 'text-green-500'
                : candidate.atsScore >= 50
                  ? 'text-yellow-500'
                  : 'text-red-500'
            )}
          >
            {candidate.atsScore}%
          </span>
        )}
      </div>
      {candidate.roundStatus === 'scheduled' && (
        <div className="mt-1.5">
          <span className="flex items-center gap-1 text-[10px] text-green-500">
            <CheckCircle2 className="h-2.5 w-2.5" />
            Interview scheduled
          </span>
        </div>
      )}
    </div>
  )
}

function Column({
  id,
  name,
  candidates,
  onOpen,
}: {
  id: string
  name: string
  candidates: Candidate[]
  onOpen: (candidate: Candidate) => void
}) {
  const { setNodeRef, isOver } = useDroppable({ id })

  return (
    <div className="w-56 flex-shrink-0">
      <div className="flex items-center justify-between rounded-t-lg border border-border border-b-0 bg-muted/50 px-3 py-2.5">
        <span className="truncate text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {name}
        </span>
        <span className="ml-2 flex-shrink-0 rounded-full border border-border bg-background px-2 py-0.5 text-xs text-muted-foreground">
          {candidates.length}
        </span>
      </div>
      <div
        ref={setNodeRef}
        className={cn(
          'min-h-[400px] rounded-b-lg border border-border border-t-0 bg-muted/20 p-2 transition-colors',
          isOver && 'bg-primary/5'
        )}
      >
        {candidates.map((candidate) => (
          <KanbanCard
            key={candidate.id}
            candidate={candidate}
            onOpen={() => onOpen(candidate)}
          />
        ))}
        {id === 'hired' && candidates.length > 0 && (
          <div className="py-2 text-center">
            <p className="text-xs text-green-500">{candidates.length} hired</p>
          </div>
        )}
      </div>
    </div>
  )
}

export function PipelineBoard({
  rounds,
  inboxCandidates,
  pipelineCandidates,
  isLoading,
  onMove,
  onOpen,
}: {
  rounds: InterviewRound[]
  inboxCandidates: Candidate[]
  pipelineCandidates: Candidate[]
  isLoading?: boolean
  onMove: (candidateId: string, newStageId: string) => void
  onOpen: (candidate: Candidate) => void
}) {
  const columns = useMemo(() => {
    const defaultCols = [
      { id: 'inbox', name: 'Submitted', candidates: [] as Candidate[] },
      ...rounds.map((round) => ({
        id: `round-${round.roundNumber}`,
        name: `Round ${round.roundNumber} - ${round.interviewerName}`,
        candidates: [] as Candidate[],
      })),
      { id: 'offer', name: 'Offer', candidates: [] as Candidate[] },
      { id: 'hired', name: 'Hired', candidates: [] as Candidate[] },
    ]

    inboxCandidates.forEach((candidate) => {
      defaultCols[0].candidates.push({ ...candidate, currentStageId: 'inbox' })
    })

    pipelineCandidates.forEach((candidate) => {
      const colId = candidate.currentStageId || 'inbox'
      const column = defaultCols.find((item) => item.id === colId)
      if (column) {
        column.candidates.push(candidate)
      }
    })

    return defaultCols
  }, [inboxCandidates, pipelineCandidates, rounds])

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event
    if (!over) return
    const candidateId = active.id as string
    const newColId = over.id as string
    onMove(candidateId, newColId)
    if (newColId === 'hired') {
      confetti({ particleCount: 100, spread: 70, origin: { y: 0.6 } })
    }
  }

  if (isLoading) {
    return (
      <div className="flex h-40 items-center justify-center">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    )
  }

  return (
    <DndContext onDragEnd={handleDragEnd} collisionDetection={closestCenter}>
      <div className="flex gap-3 overflow-x-auto pb-4">
        {columns.map((column) => (
          <Column
            key={column.id}
            id={column.id}
            name={column.name}
            candidates={column.candidates}
            onOpen={onOpen}
          />
        ))}
      </div>
    </DndContext>
  )
}

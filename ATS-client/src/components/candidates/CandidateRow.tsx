import type { Candidate } from '../../types'
import { Avatar } from '../shared/Avatar'
import { ScoreBadge } from './ScoreBadge'
import { timeAgo } from '../../lib/utils'

export function CandidateRow({ candidate, onClick }: { candidate: Candidate; onClick: () => void }) {
  return (
    <button onClick={onClick} className="grid h-14 w-full grid-cols-[auto_1fr_auto_auto_auto] items-center gap-4 rounded-[10px] px-4 text-left transition hover:bg-[var(--bg-hover)]">
      <Avatar name={candidate.name} />
      <div className="min-w-0">
        <div className="truncate text-[13px] font-semibold">{candidate.name}</div>
        <div className="truncate text-[11px] text-[var(--text-2)]">{candidate.candidateEmail}</div>
      </div>
      <span className="rounded-full bg-[var(--bg-hover)] px-3 py-1 text-[11px] text-[var(--text-2)]">{candidate.role}</span>
      <ScoreBadge score={candidate.atsScore} />
      <div className="text-right">
        <div className="text-[11px] text-[var(--text-1)]">{candidate.currentStage ?? 'Inbox'}</div>
        <div className="text-[11px] text-[var(--text-2)]">{timeAgo(candidate.createdAt)}</div>
      </div>
    </button>
  )
}

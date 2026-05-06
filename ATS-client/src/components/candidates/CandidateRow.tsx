import type { Candidate } from '../../types'
import { Avatar } from '../shared/Avatar'
import { ScoreBadge } from './ScoreBadge'
import { timeAgo } from '../../lib/utils'

export function CandidateRow({ candidate, onClick }: { candidate: Candidate; onClick: () => void }) {
  return (
    <button onClick={onClick} className="grid min-h-[64px] w-full grid-cols-[minmax(260px,1fr)_160px_120px_140px] items-center gap-4 px-4 text-left transition hover:bg-[#fbfcfd]">
      <div className="flex min-w-0 items-center gap-3">
        <Avatar name={candidate.name} />
        <div className="min-w-0">
          <div className="truncate text-[13px] font-semibold text-[#101828]">{candidate.name}</div>
          <div className="truncate text-[12px] text-[#667085]">{candidate.candidateEmail}</div>
        </div>
      </div>
      <span className="w-fit rounded-[6px] bg-[#f2f4f7] px-2.5 py-1 text-[11px] font-medium text-[#475467]">{candidate.role}</span>
      <ScoreBadge score={candidate.atsScore} />
      <div className="text-right">
        <div className="text-[12px] font-medium text-[#101828]">{candidate.currentStage ?? 'Inbox'}</div>
        <div className="text-[11px] text-[#98a2b3]">{timeAgo(candidate.createdAt)}</div>
      </div>
    </button>
  )
}

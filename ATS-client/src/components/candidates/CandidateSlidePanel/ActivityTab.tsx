import type { Candidate } from '../../../types'
import { timeAgo } from '../../../lib/utils'
import { Avatar } from '../../shared/Avatar'

export function ActivityTab({ candidate }: { candidate: Candidate }) {
  return (
    <div className="space-y-4">
      {(candidate.stageHistory ?? []).map((item) => (
        <div key={item.id} className="flex gap-3">
          <div className={`mt-2 h-2.5 w-2.5 rounded-full ${item.type === 'status' ? 'bg-[var(--brand)]' : 'bg-[var(--text-3)]'}`} />
          <Avatar name={item.actorName} size="sm" />
          <div>
            <p className="text-sm">{item.text}</p>
            <p className="text-xs text-[var(--text-2)]">{timeAgo(item.createdAt)}</p>
          </div>
        </div>
      ))}
    </div>
  )
}

import { STATUS_COLORS } from '../../lib/constants'
import type { CandidateStatus } from '../../types'

export function StatusBadge({ status }: { status: CandidateStatus | 'draft' | 'open' | 'paused' | 'completed' }) {
  const styles = STATUS_COLORS[status]
  return (
    <span className="inline-flex rounded-full border px-2.5 py-1 text-[11px] font-medium capitalize" style={{ background: styles.bg, color: styles.text, borderColor: styles.border }}>
      {status.replace('_', ' ')}
    </span>
  )
}

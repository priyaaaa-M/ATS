import { SCORE_COLORS } from '../../lib/constants'

export function ScoreBadge({ score }: { score?: number | null }) {
  const tone = score && score >= 80 ? SCORE_COLORS.high : score && score >= 60 ? SCORE_COLORS.medium : SCORE_COLORS.low
  return (
    <span className="inline-flex rounded-full bg-[var(--bg-hover)] px-2.5 py-1 text-[11px] font-semibold" style={{ color: tone }}>
      {score ?? 0}% ATS
    </span>
  )
}

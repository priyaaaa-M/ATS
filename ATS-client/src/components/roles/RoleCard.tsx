import type { Role } from '../../types'
import { Card, CardContent, CardHeader } from '../ui/card'
import { StatusBadge } from '../candidates/StatusBadge'
import { Avatar } from '../shared/Avatar'
import { Button } from '../ui/button'

export function RoleCard({ role, onClick }: { role: Role; onClick: () => void }) {
  const accent = role.status === 'open' ? 'var(--success)' : role.status === 'draft' ? 'var(--warning)' : 'var(--text-3)'
  return (
    <Card className="overflow-hidden transition hover:border-[var(--brand-mid)]">
      <div className="h-[3px]" style={{ background: accent }} />
      <CardHeader>
        <div className="flex items-start justify-between gap-3">
          <div>
            <p className="text-[13px] font-semibold">{role.title}</p>
            <p className="mt-1 text-[11px] text-[var(--text-2)]">{role.name}</p>
          </div>
          <StatusBadge status={role.status === 'closed' ? 'paused' : role.status} />
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex items-center gap-2 text-[11px] text-[var(--text-2)]">
          <Avatar name={role.hiringManagerName ?? 'HM'} size="sm" />
          {role.hiringManagerName ?? 'Hiring Manager'}
        </div>
        <div className="flex flex-wrap gap-2">
          {(role.workTags ?? []).slice(0, 3).map((tag) => <span key={tag} className="rounded-full bg-[var(--bg-hover)] px-2.5 py-1 text-[11px]">{tag}</span>)}
        </div>
        <div className="grid grid-cols-3 gap-3 text-[11px]">
          <div><p className="text-[var(--text-2)]">Candidates</p><p className="font-semibold">{role.candidateCount ?? 0}</p></div>
          <div><p className="text-[var(--text-2)]">Rounds</p><p className="font-semibold">{role.interviewStages?.length ?? 0}</p></div>
          <div><p className="text-[var(--text-2)]">Avg ATS</p><p className="font-semibold">{role.averageAtsScore ?? 0}%</p></div>
        </div>
        <div className="h-2 rounded-full bg-[var(--bg-hover)]">
          <div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${Math.min((role.candidateCount ?? 0) * 10, 100)}%` }} />
        </div>
        <div className="flex gap-2">
          <Button variant="secondary" className="flex-1" onClick={onClick}>View Role</Button>
          <Button variant="outline" className="flex-1">Edit</Button>
        </div>
      </CardContent>
    </Card>
  )
}

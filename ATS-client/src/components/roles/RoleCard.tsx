import type { Role } from '../../types'
import { StatusBadge } from '../candidates/StatusBadge'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'

function getPipelineWidth(role: Role) {
  const submitted = role.pipelineCounts?.submitted || 0
  const inProcess = role.pipelineCounts?.inProcess || 0
  const hired = role.pipelineCounts?.hired || 0
  const total = Math.max(role.candidateCount || 0, 1)

  return {
    submitted: (submitted / total) * 100,
    inProcess: (inProcess / total) * 100,
    hired: (hired / total) * 100,
  }
}

export function RoleCard({
  role,
  onClick,
}: {
  role: Role
  onClick: () => void
}) {
  const status = role.status ?? 'open'
  const widths = getPipelineWidth(role)

  return (
    <Card className="group overflow-hidden rounded-[24px] border border-border/80 bg-card/90 transition-all duration-200 hover:-translate-y-0.5 hover:border-primary/40 hover:shadow-[0_18px_50px_rgba(0,0,0,0.18)]">
      <div className="h-1 w-full bg-gradient-to-r from-emerald-400 via-primary to-orange-400" />
      <CardContent className="space-y-4 p-5">
        <div className="flex items-start justify-between gap-3">
          <div className="space-y-1.5">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-primary/12 text-sm font-semibold text-primary">
                {(role.title || role.name).slice(0, 2).toUpperCase()}
              </div>
              <div>
                <p className="text-lg font-semibold leading-tight text-foreground">
                  {role.title || role.name}
                </p>
                <p className="text-sm text-muted-foreground">{role.name}</p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
              <span className="rounded-full bg-muted px-3 py-1">
                {role.hiringManagerName || 'No hiring manager'}
              </span>
              <span className="rounded-full bg-muted px-3 py-1">
                {role.screeningQuestions?.length || 0} criteria
              </span>
            </div>
          </div>

          <StatusBadge status={status === 'closed' ? 'paused' : status} />
        </div>

        <div className="grid gap-3 sm:grid-cols-3">
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Candidates
            </p>
            <p className="mt-1.5 text-xl font-semibold text-foreground">
              {role.candidateCount ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Interview Rounds
            </p>
            <p className="mt-1.5 text-xl font-semibold text-foreground">
              {role.roundCount ?? role.interviewStages?.length ?? 0}
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-muted/30 p-3.5">
            <p className="text-xs uppercase tracking-[0.18em] text-muted-foreground">
              Avg ATS
            </p>
            <p className="mt-1.5 text-xl font-semibold text-foreground">
              {role.averageAtsScore ?? 0}%
            </p>
          </div>
        </div>

        <div className="rounded-2xl border border-border/70 bg-muted/20 p-3.5">
          <div className="mb-2.5 flex items-center justify-between">
            <p className="text-sm font-medium text-foreground">Pipeline Health</p>
            <p className="text-xs text-muted-foreground">
              Submitted {role.pipelineCounts?.submitted || 0} · In Process{' '}
              {role.pipelineCounts?.inProcess || 0} · Hired {role.pipelineCounts?.hired || 0}
            </p>
          </div>

          <div className="h-3 overflow-hidden rounded-full bg-muted">
            <div className="flex h-full w-full">
              <div
                className="h-full bg-orange-500"
                style={{ width: `${widths.submitted}%` }}
              />
              <div
                className="h-full bg-sky-500"
                style={{ width: `${widths.inProcess}%` }}
              />
              <div
                className="h-full bg-emerald-500"
                style={{ width: `${widths.hired}%` }}
              />
            </div>
          </div>

          <div className="mt-2.5 grid grid-cols-3 gap-3 text-xs text-muted-foreground">
            <div className="rounded-xl bg-background/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide">Submitted</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {role.pipelineCounts?.submitted || 0}
              </p>
            </div>
            <div className="rounded-xl bg-background/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide">In Process</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {role.pipelineCounts?.inProcess || 0}
              </p>
            </div>
            <div className="rounded-xl bg-background/60 px-3 py-2">
              <p className="text-[10px] uppercase tracking-wide">Hired</p>
              <p className="mt-0.5 text-sm font-semibold text-foreground">
                {role.pipelineCounts?.hired || 0}
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button className="h-11 flex-1" onClick={onClick}>
            View Role
          </Button>
          <Button variant="outline" className="h-11 flex-1" onClick={onClick}>
            Edit Criteria
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}

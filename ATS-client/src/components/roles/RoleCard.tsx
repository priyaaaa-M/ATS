import type { Role } from '../../types'
import { StatusBadge } from '../candidates/StatusBadge'
import { Button } from '../ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu'
import { ChevronDown } from 'lucide-react'

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
  onView,
  onEditCriteria,
  onStatusChange,
}: {
  role: Role
  onView: () => void
  onEditCriteria: () => void
  onStatusChange?: (status: 'open' | 'paused' | 'draft' | 'closed') => void
}) {
  const status = role.status ?? 'open'
  const widths = getPipelineWidth(role)

  return (
    <div className="group h-full flex flex-col rounded-2xl p-6 bg-transparent">
      <div className="flex items-start justify-between gap-3 mb-6">
        <div className="space-y-1.5 flex-1">
          <div className="flex items-center gap-4">
            <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-brand/20 to-brand/5 text-sm font-bold text-brand ring-1 ring-brand/20 shadow-inner">
              {(role.title || role.name).slice(0, 2).toUpperCase()}
            </div>
            <div>
              <p className="text-xl font-bold leading-tight text-white group-hover:text-brand transition-colors">
                {role.title || role.name}
              </p>
              <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider mt-0.5">{role.name}</p>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-3 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
            <span className="rounded-lg bg-muted border border-border px-2 py-1">
              {role.hiringManagerName || 'No hiring manager'}
            </span>
            <span className="rounded-lg bg-muted border border-border px-2 py-1 flex items-center gap-1">
              <span className="w-1.5 h-1.5 rounded-full bg-brand"></span>
              {role.screeningQuestions?.length || 0} criteria
            </span>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <div className="cursor-pointer transition-all hover:opacity-80 flex items-center gap-1 group/status">
                <StatusBadge status={status === 'closed' ? 'paused' : status} />
                <ChevronDown className="h-3 w-3 text-muted-foreground group-hover/status:text-brand transition-colors" />
              </div>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-36 bg-[#1a1a1a] border-border border shadow-2xl p-1 z-[100]">
              {(['open', 'paused', 'draft', 'closed'] as const).map((s) => (
                <DropdownMenuItem
                  key={s}
                  onSelect={() => {
                    console.log('ITEM SELECTED:', s)
                    onStatusChange?.(s)
                  }}
                  className={`flex items-center px-3 py-2 rounded-md text-sm capitalize cursor-pointer transition-colors ${
                    status === s ? 'bg-brand/20 text-brand font-bold' : 'hover:bg-white/10'
                  }`}
                >
                  {s}
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>

          {status === 'open' && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-7 text-[10px] bg-muted/50 hover:bg-muted text-muted-foreground"
              onClick={() => {
                console.log('DIRECT PAUSE CLICKED');
                onStatusChange?.('paused');
              }}
            >
              Pause
            </Button>
          )}
        </div>
      </div>

      <div className="grid gap-3 grid-cols-3 mb-6">
        <div className="rounded-xl border border-border bg-card p-4 text-center hover:bg-accent transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Candidates
          </p>
          <p className="mt-1 text-2xl font-bold text-white">
            {role.candidateCount ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center hover:bg-accent transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Rounds
          </p>
          <p className="mt-1 text-2xl font-bold text-white">
            {role.roundCount ?? role.interviewStages?.length ?? 0}
          </p>
        </div>
        <div className="rounded-xl border border-border bg-card p-4 text-center hover:bg-accent transition-colors">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Avg Score
          </p>
          <p className="mt-1 text-2xl font-bold text-white flex items-baseline justify-center gap-0.5">
            {role.averageAtsScore ?? 0}<span className="text-sm text-muted-foreground">%</span>
          </p>
        </div>
      </div>

      <div className="rounded-xl border border-border bg-card p-4 mb-6 flex-1 flex flex-col justify-end">
        <div className="mb-3 flex items-center justify-between">
          <p className="text-sm font-semibold text-white">Pipeline Health</p>
        </div>

        <div className="h-2 overflow-hidden rounded-full bg-accent shadow-inner">
          <div className="flex h-full w-full">
            <div
              className="h-full bg-brand shadow-[0_0_8px_rgba(249,115,22,0.6)]"
              style={{ width: `${widths.submitted}%` }}
            />
            <div
              className="h-full bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
              style={{ width: `${widths.inProcess}%` }}
            />
            <div
              className="h-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.6)]"
              style={{ width: `${widths.hired}%` }}
            />
          </div>
        </div>

        <div className="mt-3 flex justify-between gap-1 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground">
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-brand"></div>
            <span>Applied ({role.pipelineCounts?.submitted || 0})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-blue-500"></div>
            <span>In Process ({role.pipelineCounts?.inProcess || 0})</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
            <span>Hired ({role.pipelineCounts?.hired || 0})</span>
          </div>
        </div>
      </div>

      <div className="flex gap-3 mt-auto pt-2">
        <Button className="h-11 flex-1 btn-primary-glow rounded-xl" onClick={onView}>
          View Role
        </Button>
        <Button variant="outline" className="h-11 flex-1 rounded-xl bg-muted hover:bg-accent border-border text-white" onClick={onEditCriteria}>
          Edit Criteria
        </Button>
      </div>
    </div>
  )
}

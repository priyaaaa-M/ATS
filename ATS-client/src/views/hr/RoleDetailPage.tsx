import { useMemo } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, CalendarClock, CheckCircle2, FileUp, Settings, Users } from 'lucide-react'
import { candidatesApi, roundsApi, sourcesApi } from '../../api'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { EmptyState } from '../../components/shared/EmptyState'
import { timeAgo } from '../../lib/utils'

export function RoleDetailPage() {
  const navigate = useNavigate()
  const { roleName = '' } = useParams()
  const decodedRole = decodeURIComponent(roleName)

  const { data: candidates = [], isLoading } = useQuery({
    queryKey: ['role-candidates', decodedRole],
    queryFn: () => candidatesApi.list({ role: decodedRole }),
    enabled: Boolean(decodedRole),
  })

  const { data: rounds = [] } = useQuery({
    queryKey: ['rounds', decodedRole],
    queryFn: () => roundsApi.listByRole(decodedRole),
    enabled: Boolean(decodedRole),
  })

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: () => sourcesApi.list(),
  })

  const sourceCounts = useMemo(() => {
    const counts = new Map<string, number>()
    candidates.forEach((candidate) => {
      const source = candidate.source || 'Unknown'
      counts.set(source, (counts.get(source) || 0) + 1)
    })
    return Array.from(counts.entries()).sort((a, b) => b[1] - a[1])
  }, [candidates])

  const stats = [
    { label: 'Total', value: candidates.length, icon: Users },
    { label: 'Needs Review', value: candidates.filter((item) => item.inboxStatus === 'inbox').length, icon: FileUp },
    { label: 'In Process', value: candidates.filter((item) => ['hr_approved', 'scheduled', 'completed'].includes(item.status)).length, icon: CalendarClock },
    { label: 'Hired', value: candidates.filter((item) => item.status === 'selected').length, icon: CheckCircle2 },
  ]

  const recent = [...candidates]
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 8)

  return (
    <div className="space-y-7 pb-10">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <button
            onClick={() => navigate('/roles')}
            className="mb-4 inline-flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-foreground"
          >
            <ArrowLeft className="h-4 w-4" />
            Back to roles
          </button>
          <h1 className="text-3xl font-bold tracking-tight text-foreground">{decodedRole}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Role command center for candidates, rounds, sources, and next actions.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button asChild variant="outline">
            <Link to={`/candidates?role=${encodeURIComponent(decodedRole)}`}>Open Candidates</Link>
          </Button>
          <Button asChild>
            <Link to="/settings?tab=rounds">
              <Settings className="h-4 w-4" />
              Manage Rounds
            </Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
        {stats.map((stat) => (
          <div key={stat.label} className="glass-card p-5">
            <div className="mb-4 flex items-center justify-between">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
                <stat.icon className="h-5 w-5" />
              </div>
              <span className="text-xs text-muted-foreground">{stat.label}</span>
            </div>
            <p className="text-3xl font-bold text-foreground">{stat.value}</p>
          </div>
        ))}
      </div>

      <div className="grid gap-6 xl:grid-cols-[1.2fr_0.8fr]">
        <div className="glass-card p-0 overflow-hidden">
          <div className="border-b border-border p-6">
            <h2 className="text-lg font-semibold text-foreground">Pipeline Snapshot</h2>
            <p className="text-xs text-muted-foreground">Recent candidates for this role.</p>
          </div>
          {isLoading ? (
            <div className="p-10 text-sm text-muted-foreground">Loading role candidates...</div>
          ) : recent.length ? (
            <div className="divide-y divide-border">
              {recent.map((candidate) => (
                <Link
                  key={candidate.id}
                  to={`/candidates?role=${encodeURIComponent(decodedRole)}&candidate=${candidate.id}`}
                  className="grid gap-3 p-4 transition-colors hover:bg-muted/30 md:grid-cols-[1fr_auto_auto]"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-semibold text-foreground">{candidate.name}</p>
                    <p className="mt-1 truncate text-xs text-muted-foreground">{candidate.candidateEmail || 'No email'}</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    {candidate.source && <Badge variant="outline">{candidate.source}</Badge>}
                    <Badge variant="secondary">{candidate.status?.replace(/_/g, ' ')}</Badge>
                  </div>
                  <div className="text-right text-xs text-muted-foreground">
                    {timeAgo(candidate.createdAt)}
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="p-10">
              <EmptyState icon={Users} title="No candidates yet" description="Import resumes for this role to start the pipeline." />
            </div>
          )}
        </div>

        <div className="space-y-6">
          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Interview Rounds</h2>
            <div className="mt-4 space-y-3">
              {rounds.length ? rounds.map((round) => (
                <div key={round.id} className="rounded-xl border border-border bg-muted/20 p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <p className="text-sm font-semibold text-foreground">Round {round.roundNumber}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{round.interviewerName}</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">{round.interviewerGmail}</p>
                    </div>
                    <Badge variant="outline">{round.duration || '45 min'}</Badge>
                  </div>
                </div>
              )) : (
                <div className="rounded-xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                  No rounds configured.
                </div>
              )}
            </div>
          </div>

          <div className="glass-card p-6">
            <h2 className="text-lg font-semibold text-foreground">Source Mix</h2>
            <div className="mt-4 space-y-3">
              {sourceCounts.length ? sourceCounts.map(([source, count]) => (
                <div key={source} className="flex items-center gap-3">
                  <span className="w-28 truncate text-sm text-muted-foreground">{source}</span>
                  <div className="h-2 flex-1 overflow-hidden rounded-full bg-muted">
                    <div
                      className="h-full rounded-full bg-primary"
                      style={{ width: `${Math.max((count / Math.max(candidates.length, 1)) * 100, 8)}%` }}
                    />
                  </div>
                  <span className="w-8 text-right text-sm font-semibold text-foreground">{count}</span>
                </div>
              )) : (
                <p className="text-sm text-muted-foreground">No source data yet.</p>
              )}
              {!sourceCounts.length && sources.filter((source) => source.active).slice(0, 4).map((source) => (
                <Badge key={source.id} variant="outline" className="mr-2 mt-2">{source.name}</Badge>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

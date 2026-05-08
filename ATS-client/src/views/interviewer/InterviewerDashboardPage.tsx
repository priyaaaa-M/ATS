import { useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import {
  Calendar,
  CheckCircle2,
  ChevronRight,
  Loader2,
  MessageSquare,
  Users,
  Video,
} from 'lucide-react'
import { format } from 'date-fns'
import { candidatesApi, interviewsApi } from '../../api'
import { CandidateSlidePanel } from '../../components/candidates/CandidateSlidePanel'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import { Card } from '../../components/ui/card'
import { cn } from '../../lib/utils'
import { useAuthStore } from '../../store/authStore'

function stringToColor(str: string) {
  const colors = ['#EC5B24', '#387DF1', '#0FA596', '#8B5CF6', '#DDA615', '#22A268', '#DB3232']
  let hash = 0
  for (let index = 0; index < str.length; index += 1) {
    hash = str.charCodeAt(index) + ((hash << 5) - hash)
  }
  return colors[Math.abs(hash) % colors.length]
}

function CandidateList({
  title,
  candidates,
  isLoading,
  onOpen,
  onSetDefaultTab,
}: {
  title: string
  candidates: any[]
  isLoading?: boolean
  onOpen: (index: number) => void
  onSetDefaultTab: (tab: string) => void
}) {
  return (
    <div>
      <h2 className="mb-4 text-sm font-semibold">{title}</h2>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : candidates.length === 0 ? (
        <Card className="p-12 text-center">
          <Users className="mx-auto mb-3 h-10 w-10 text-muted-foreground opacity-30" />
          <p className="text-sm font-medium">No candidates here yet</p>
          <p className="mt-1 text-xs text-muted-foreground">
            This list will update automatically as your interview flow progresses.
          </p>
        </Card>
      ) : (
        <div className="space-y-3">
          {candidates.map((candidate, index) => (
            <Card
              key={candidate.id}
              className="cursor-pointer p-4 transition-colors hover:border-primary/50"
              onClick={() => onOpen(index)}
            >
              <div className="flex items-center gap-4">
                <div
                  className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-sm font-bold text-white"
                  style={{ background: stringToColor(candidate.name || '') }}
                >
                  {candidate.name?.slice(0, 2).toUpperCase()}
                </div>

                <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold">{candidate.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {candidate.role} · Round {candidate.currentRound}
                  </p>
                </div>

                {candidate.atsScore && (
                  <span
                    className={cn(
                      'rounded px-2 py-1 text-xs font-bold',
                      candidate.atsScore >= 75
                        ? 'bg-green-500/10 text-green-400'
                        : 'bg-yellow-500/10 text-yellow-400'
                    )}
                  >
                    {candidate.atsScore}%
                  </span>
                )}

                <Badge
                  variant="outline"
                  className={cn(
                    'flex-shrink-0 text-xs',
                    candidate.status === 'selected'
                      ? 'border-emerald-500/50 text-emerald-400'
                      : candidate.roundStatus === 'scheduled'
                        ? 'border-green-500/50 text-green-400'
                        : candidate.roundStatus === 'completed'
                          ? 'border-blue-500/50 text-blue-400'
                          : 'border-yellow-500/50 text-yellow-400'
                  )}
                >
                  {candidate.status === 'selected'
                    ? 'Selected'
                    : candidate.roundStatus === 'scheduled'
                      ? 'Scheduled'
                      : candidate.roundStatus === 'completed'
                        ? 'Completed'
                        : 'Pending slot'}
                </Badge>

                <div onClick={(event) => event.stopPropagation()}>
                  {candidate.roundStatus === 'pending' && (
                    <Button
                      size="sm"
                      onClick={() => {
                        onSetDefaultTab('bookslot')
                        onOpen(index)
                      }}
                    >
                      Book Interview
                    </Button>
                  )}
                  {candidate.roundStatus === 'scheduled' && candidate.meetLink && (
                    <a href={candidate.meetLink} target="_blank" rel="noreferrer">
                      <Button
                        size="sm"
                        className="border border-green-500/30 bg-green-500/15 text-green-400"
                      >
                        <Video className="mr-1 h-3 w-3" />
                        Join Meet
                      </Button>
                    </a>
                  )}
                  {candidate.roundStatus === 'completed' && (
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        onSetDefaultTab('feedback')
                        onOpen(index)
                      }}
                    >
                      {candidate.feedbackSubmitted ? 'View Feedback' : 'Give Feedback'}
                    </Button>
                  )}
                </div>

                <ChevronRight className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
              </div>
            </Card>
          ))}
        </div>
      )}
    </div>
  )
}

export function InterviewerDashboardPage() {
  const { user } = useAuthStore()
  const [view, setView] = useState<'assigned' | 'approved'>('assigned')
  const [selectedIndex, setSelectedIndex] = useState<number | null>(null)
  const [defaultTab, setDefaultTab] = useState('overview')

  const { data: myCandidates = [], isLoading } = useQuery({
    queryKey: ['my-candidates'],
    queryFn: () => candidatesApi.list(),
  })

  const { data: approvedCandidates = [], isLoading: isApprovedLoading } = useQuery({
    queryKey: ['approved-by-me'],
    queryFn: () => candidatesApi.approvedByMe(),
  })

  const { data: myInterviews = [] } = useQuery({
    queryKey: ['my-interviews'],
    queryFn: () => interviewsApi.getMyInterviews(),
  })

  const visibleCandidates = view === 'assigned' ? myCandidates : approvedCandidates
  const selectedCandidate =
    selectedIndex !== null ? visibleCandidates[selectedIndex] ?? null : null

  const stats = useMemo(
    () => ({
      total: myCandidates.length,
      scheduled: myCandidates.filter((candidate) => candidate.roundStatus === 'scheduled').length,
      completed: myCandidates.filter((candidate) => candidate.roundStatus === 'completed').length,
      pendingFeedback: myCandidates.filter(
        (candidate) => candidate.roundStatus === 'completed' && !candidate.feedbackSubmitted
      ).length,
      approved: approvedCandidates.length,
    }),
    [approvedCandidates, myCandidates]
  )

  const openCandidate = (index: number) => {
    setSelectedIndex(index)
  }

  return (
    <div className="space-y-6 p-8">
      <div>
        <h1 className="text-xl font-semibold">Good morning, {user?.name?.split(' ')[0]}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your assigned interviews, approvals, and next actions
        </p>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Assigned
            </span>
            <Users className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-primary">{stats.total}</p>
          <p className="mt-1 text-xs text-muted-foreground">Current candidates</p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Scheduled
            </span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-primary">{stats.scheduled}</p>
          <p className="mt-1 text-xs text-muted-foreground">Interviews booked</p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Needs feedback
            </span>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-yellow-400">{stats.pendingFeedback}</p>
          <p className="mt-1 text-xs text-muted-foreground">Awaiting your review</p>
        </Card>

        <Card className="p-5">
          <div className="mb-3 flex items-center justify-between">
            <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              Approved
            </span>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </div>
          <p className="text-3xl font-bold text-emerald-400">{stats.approved}</p>
          <p className="mt-1 text-xs text-muted-foreground">Passed by you</p>
        </Card>
      </div>

      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => {
            setView('assigned')
            setSelectedIndex(null)
          }}
          className={cn(
            'rounded-full border px-4 py-2 text-sm transition-all',
            view === 'assigned'
              ? 'border-primary bg-primary text-white'
              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
        >
          Assigned Candidates ({myCandidates.length})
        </button>
        <button
          onClick={() => {
            setView('approved')
            setSelectedIndex(null)
          }}
          className={cn(
            'rounded-full border px-4 py-2 text-sm transition-all',
            view === 'approved'
              ? 'border-primary bg-primary text-white'
              : 'border-border text-muted-foreground hover:border-primary/40 hover:text-foreground'
          )}
        >
          Approved by Me ({approvedCandidates.length})
        </button>
      </div>

      <CandidateList
        title={view === 'assigned' ? 'My Candidates' : 'Candidates You Approved'}
        candidates={visibleCandidates}
        isLoading={view === 'assigned' ? isLoading : isApprovedLoading}
        onOpen={openCandidate}
        onSetDefaultTab={setDefaultTab}
      />

      {myInterviews.filter((interview) => interview.status === 'scheduled').length > 0 && (
        <div>
          <h2 className="mb-4 text-sm font-semibold">Upcoming Interviews</h2>
          <Card className="divide-y divide-border">
            {myInterviews
              .filter((interview) => interview.status === 'scheduled')
              .slice(0, 5)
              .map((interview) => (
                <div key={interview.id} className="flex items-center gap-4 p-4">
                  <div className="flex h-10 w-10 flex-shrink-0 flex-col items-center justify-center rounded-lg bg-primary/10">
                    <span className="text-xs font-bold text-primary">
                      {format(new Date(interview.scheduledStartTime || ''), 'MMM').toUpperCase()}
                    </span>
                    <span className="text-sm font-bold leading-none text-primary">
                      {format(new Date(interview.scheduledStartTime || ''), 'd')}
                    </span>
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium">{interview.candidateName}</p>
                    <p className="text-xs text-muted-foreground">
                      {format(new Date(interview.scheduledStartTime || ''), 'h:mm a')} ·{' '}
                      {interview.durationMinutes} min
                    </p>
                  </div>
                  {interview.meetLink && (
                    <a href={interview.meetLink} target="_blank" rel="noreferrer">
                      <Button size="sm" variant="outline">
                        <Video className="mr-1 h-3 w-3" />
                        Join
                      </Button>
                    </a>
                  )}
                </div>
              ))}
          </Card>
        </div>
      )}

      <CandidateSlidePanel
        open={Boolean(selectedCandidate)}
        candidate={selectedCandidate}
        candidates={visibleCandidates}
        selectedIndex={selectedIndex}
        setSelectedIndex={setSelectedIndex}
        filters={{ activeStatus: 'all', activeRole: 'all', search: '' }}
        initialTab={defaultTab}
      />
    </div>
  )
}

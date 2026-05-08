import { useEffect, useMemo, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  DollarSign,
  Download,
  Info,
  Loader2,
  Lock,
  Mail,
  MessageSquare,
  Phone,
  Video,
  X,
  ClipboardList,
} from 'lucide-react'
import { format, formatDistanceToNow } from 'date-fns'
import { toast } from 'sonner'
import { candidatesApi, feedbackApi, interviewsApi, rolesApi } from '../../../api'
import type { Candidate, Interview, ParsedData } from '../../../types'
import { useAuthStore } from '../../../store/authStore'
import { cn } from '../../../lib/utils'
import { Badge } from '../../ui/badge'
import { Button } from '../../ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '../../ui/dropdown-menu'
import { Popover, PopoverContent, PopoverTrigger } from '../../ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { Textarea } from '../../ui/textarea'
import { BookSlotTab } from './BookSlotTab'

type CandidateFiltersKey = {
  activeStatus: string
  activeRole: string
  search: string
}

const activityColors: Record<string, string> = {
  status_change: 'bg-primary',
  note_added: 'bg-blue-500',
  interview_scheduled: 'bg-green-500',
  feedback_submitted: 'bg-purple-500',
  system: 'bg-muted-foreground',
}

function generateSummary(data?: ParsedData | null) {
  const expYears = data?.experience?.length || 0
  const topSkills = data?.skills?.slice(0, 5).map((skill) => skill.name).join(', ') || ''
  const latestJob = data?.experience?.[0]
  return `${latestJob?.title || 'Professional'} with ${expYears} roles on record. Key skills: ${topSkills}.`
}

function getDriveEmbedUrl(url: string) {
  const fileIdMatch = url.match(/\/d\/([a-zA-Z0-9_-]+)/)
  if (fileIdMatch) return `https://drive.google.com/file/d/${fileIdMatch[1]}/preview`
  return url
}

export function CandidateSlidePanel({
  open,
  candidate,
  candidates,
  selectedIndex,
  setSelectedIndex,
  filters,
  initialTab,
}: {
  open: boolean
  candidate: Candidate | null
  candidates: Candidate[]
  selectedIndex: number | null
  setSelectedIndex: (index: number | null) => void
  filters: CandidateFiltersKey
  initialTab?: string
}) {
  const queryClient = useQueryClient()
  const { user } = useAuthStore()
  const isInterviewer = user?.role === 'interviewer'
  const [activeTab, setActiveTab] = useState(initialTab || 'overview')
  const [panelWidth, setPanelWidth] = useState(720)
  const [zoom, setZoom] = useState(100)
  const [showRejectDropdown, setShowRejectDropdown] = useState(false)
  const [rejectReason, setRejectReason] = useState('')
  const [noteText, setNoteText] = useState('')
  const [answers, setAnswers] = useState<Record<string, 'yes' | 'no' | 'unknown'>>({})
  const [overallFit, setOverallFit] = useState('')
  const isDragging = useRef(false)
  const startX = useRef(0)
  const startWidth = useRef(0)

  const closePanel = () => {
    setSelectedIndex(null)
    window.history.replaceState(null, '', window.location.pathname)
  }

  useEffect(() => {
    if (open) setActiveTab(initialTab || (isInterviewer ? 'overview' : 'overview'))
  }, [open, initialTab, isInterviewer])

  useEffect(() => {
    return () => {
      document.removeEventListener('mousemove', onMouseMove)
      document.removeEventListener('mouseup', onMouseUp)
    }
  }, [])

  const onMouseMove = (e: MouseEvent) => {
    if (!isDragging.current) return
    const diff = startX.current - e.clientX
    const newWidth = Math.min(900, Math.max(480, startWidth.current + diff))
    setPanelWidth(newWidth)
  }

  const onMouseUp = () => {
    isDragging.current = false
    document.removeEventListener('mousemove', onMouseMove)
    document.removeEventListener('mouseup', onMouseUp)
  }

  const onMouseDown = (e: React.MouseEvent) => {
    isDragging.current = true
    startX.current = e.clientX
    startWidth.current = panelWidth
    document.addEventListener('mousemove', onMouseMove)
    document.addEventListener('mouseup', onMouseUp)
  }

  const goNext = () => {
    if (selectedIndex === null || candidates.length === 0) return
    const next = (selectedIndex + 1) % candidates.length
    setSelectedIndex(next)
    window.history.replaceState(null, '', `?candidate=${candidates[next].id}`)
  }

  const goPrev = () => {
    if (selectedIndex === null || candidates.length === 0) return
    const prev = selectedIndex === 0 ? candidates.length - 1 : selectedIndex - 1
    setSelectedIndex(prev)
    window.history.replaceState(null, '', `?candidate=${candidates[prev].id}`)
  }

  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (!candidate) return
      if (e.key === 'ArrowRight') goNext()
      if (e.key === 'ArrowLeft') goPrev()
      if (e.key === 'Escape') closePanel()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [candidate, selectedIndex, candidates])

  const { data: scheduledInterviews = [] } = useQuery({
    queryKey: ['candidate-interviews', candidate?.id],
    queryFn: () => interviewsApi.getByCandidateId(candidate!.id),
    enabled: Boolean(candidate?.id),
  })
  const scheduledInterview = scheduledInterviews[0] as Interview | undefined

  const { data: activities = [] } = useQuery({
    queryKey: ['activity', candidate?.id],
    queryFn: () => candidatesApi.getActivity(candidate!.id),
    enabled: Boolean(candidate?.id),
  })

  const { data: notes = [], refetch: refetchNotes } = useQuery({
    queryKey: ['notes', candidate?.id],
    queryFn: () => candidatesApi.getNotes(candidate!.id),
    enabled: Boolean(candidate?.id),
  })

  const { data: roleQuestions = [] } = useQuery({
    queryKey: ['screening-questions', candidate?.role],
    queryFn: () => rolesApi.getScreeningQuestions(candidate!.role),
    enabled: Boolean(candidate?.role),
  })

  const { data: scorecard, refetch: refetchScorecard } = useQuery({
    queryKey: ['scorecard', candidate?.id],
    queryFn: () => candidatesApi.getScorecard(candidate!.id),
    enabled: Boolean(candidate?.id),
  })

  const { data: feedback = [] } = useQuery({
    queryKey: ['feedback', candidate?.id, candidate?.currentRound],
    queryFn: () => feedbackApi.getByRound(candidate!.id, candidate?.currentRound || 1),
    enabled: Boolean(candidate?.id && candidate?.currentRound),
  })

  useEffect(() => {
    if (scorecard) {
      const mapped: Record<string, 'yes' | 'no' | 'unknown'> = {}
      scorecard.criteria?.forEach((criterion) => {
        mapped[criterion.questionId] = criterion.value
      })
      setAnswers(mapped)
      setOverallFit(scorecard.overallFit || '')
    } else {
      setAnswers({})
      setOverallFit('')
    }
  }, [scorecard])

  const updateListCandidate = (updater: (item: Candidate) => Candidate) => {
    queryClient.setQueryData<Candidate[]>(['candidates', filters], (old = []) =>
      old.map((item) => (item.id === candidate?.id ? updater(item) : item)),
    )
    queryClient.invalidateQueries({ queryKey: ['candidate-counts'] })
  }

  const approveMutation = useMutation({
    mutationFn: () => candidatesApi.approve(candidate!.id),
    onSuccess: () => {
      updateListCandidate((item) => ({ ...item, status: 'hr_approved', inboxStatus: 'pipeline' }))
      toast.success(`${candidate?.name} approved -> Round 1`)
      if (candidates.length > 1) goNext()
      else setSelectedIndex(null)
    },
    onError: (err: any) => toast.error(err.response?.data?.message || 'Approval failed'),
  })

  const rejectMutation = useMutation({
    mutationFn: (reason?: string) => candidatesApi.action(candidate!.id, { action: 'reject', reason }),
    onSuccess: () => {
      updateListCandidate((item) => ({ ...item, status: 'rejected', inboxStatus: 'rejected' }))
      toast.success('Candidate rejected')
      if (candidates.length > 1) goNext()
      else setSelectedIndex(null)
    },
  })

  const maybeLaterMutation = useMutation({
    mutationFn: () => candidatesApi.action(candidate!.id, { action: 'maybe_later' }),
    onSuccess: () => {
      updateListCandidate((item) => ({ ...item, status: 'pending', inboxStatus: 'inbox' }))
      toast.info('Moved to Maybe Later')
      if (candidates.length > 1) goNext()
    },
  })

  const advanceMutation = useMutation({
    mutationFn: () => candidatesApi.advanceRound(candidate!.id),
    onSuccess: () => {
      toast.success('Candidate passed! Moving to next round.')
      queryClient.invalidateQueries({ queryKey: ['my-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      closePanel()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not advance candidate')
    },
  })

  const failMutation = useMutation({
    mutationFn: () => candidatesApi.action(candidate!.id, { action: 'reject', reason: 'failed_interview' }),
    onSuccess: () => {
      toast.info('Candidate marked as failed')
      queryClient.invalidateQueries({ queryKey: ['my-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      closePanel()
    },
  })

  const addNoteMutation = useMutation({
    mutationFn: () => candidatesApi.addNote(candidate!.id, { text: noteText, isPrivate: true }),
    onSuccess: () => {
      setNoteText('')
      refetchNotes()
      queryClient.invalidateQueries({ queryKey: ['activity', candidate?.id] })
      toast.success('Note added')
    },
  })

  const saveScorecardMutation = useMutation({
    mutationFn: () => candidatesApi.saveScorecard(candidate!.id, {
      criteria: Object.entries(answers).map(([questionId, value]) => ({ questionId, value })),
      overallFit,
    }),
    onSuccess: () => {
      refetchScorecard()
      toast.success('Scorecard saved')
    },
  })

  useEffect(() => {
    if (!candidate) return
    if (!Object.keys(answers).length && !overallFit) return
    const timer = window.setTimeout(() => saveScorecardMutation.mutate(), 1000)
    return () => window.clearTimeout(timer)
  }, [answers, overallFit, candidate?.id])

  const tabs = isInterviewer
    ? ['overview', 'linkedin', 'resume', 'activity', 'bookslot', 'feedback']
    : ['overview', 'linkedin', 'resume', 'activity', 'scorecards', 'notes']

  const screeningAnswers = candidate?.screeningAnswers || candidate?.parsedData?.screeningAnswers || []
  const summary = candidate?.parsedData?.summary || generateSummary(candidate?.parsedData)

  if (!open || !candidate) return null

  return (
    <>
      <div className="fixed inset-0 z-40 bg-black/35" onClick={closePanel} />
      <div style={{ width: panelWidth }} className="fixed right-0 top-0 z-50 flex h-full flex-col border-l border-border bg-card shadow-2xl">
        <div className="absolute left-0 top-0 bottom-0 z-10 w-1 cursor-col-resize transition-colors hover:bg-primary/50" onMouseDown={onMouseDown} />

        <div className="flex items-center justify-between border-b border-border px-5 py-3">
          <button onClick={closePanel} className="flex h-8 w-8 items-center justify-center rounded-full hover:bg-muted">
            <X className="h-4 w-4" />
          </button>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <button onClick={goPrev} className="flex h-7 w-7 items-center justify-center rounded border border-border hover:bg-muted">
              <ChevronLeft className="h-3 w-3" />
            </button>
            <span>{(selectedIndex ?? 0) + 1} of {candidates.length}</span>
            <button onClick={goNext} className="flex h-7 w-7 items-center justify-center rounded border border-border hover:bg-muted">
              <ChevronRight className="h-3 w-3" />
            </button>
          </div>
        </div>

        <div className="border-b border-border px-5 py-4">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-xl font-semibold">{candidate.name}</h2>
              <p className="mt-1 text-sm text-muted-foreground">{candidate.parsedData?.headline || candidate.role}</p>
            </div>
            {isInterviewer ? (
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  className="border-red-500/30 text-red-400"
                  onClick={() => failMutation.mutate()}
                  disabled={failMutation.isPending}
                >
                  ✕ Fail — Reject
                </Button>
                <Button
                  size="sm"
                  className="bg-green-500 hover:bg-green-600 text-white"
                  onClick={() => advanceMutation.mutate()}
                  disabled={advanceMutation.isPending}
                >
                  {advanceMutation.isPending ? <Loader2 className="w-3 h-3 animate-spin mr-1" /> : null}
                  ✓ Pass to Round {(candidate?.currentRound || 1) + 1}
                </Button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" className="border-yellow-500/50 text-yellow-500 hover:bg-yellow-500/10" onClick={() => maybeLaterMutation.mutate()} disabled={maybeLaterMutation.isPending}>
                  {maybeLaterMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                  Maybe Later
                </Button>
                <Popover open={showRejectDropdown} onOpenChange={setShowRejectDropdown}>
                  <PopoverTrigger asChild>
                    <Button variant="outline" size="sm" className="border-red-500/50 text-red-500 hover:bg-red-500/10" disabled={rejectMutation.isPending}>
                      {rejectMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                      Reject
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64">
                    <p className="mb-3 text-sm font-medium">Rejection reason</p>
                    <Select value={rejectReason} onValueChange={setRejectReason}>
                      <SelectTrigger><SelectValue placeholder="Select reason..." /></SelectTrigger>
                      <SelectContent>
                        <SelectItem value="not_a_fit">Not a fit</SelectItem>
                        <SelectItem value="overqualified">Overqualified</SelectItem>
                        <SelectItem value="location">Location</SelectItem>
                        <SelectItem value="salary">Salary mismatch</SelectItem>
                        <SelectItem value="unresponsive">Unresponsive</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                    <Button className="mt-3 w-full bg-red-500 hover:bg-red-600" size="sm" onClick={() => { rejectMutation.mutate(rejectReason); setShowRejectDropdown(false) }}>
                      Confirm Reject
                    </Button>
                  </PopoverContent>
                </Popover>
                <Button size="sm" onClick={() => approveMutation.mutate()} disabled={approveMutation.isPending || candidate.status === 'hr_approved'}>
                  {approveMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : candidate.status === 'hr_approved' ? 'Approved' : 'Interview'}
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="sm">More <ChevronDown className="ml-1 h-3 w-3" /></Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => setActiveTab('notes')}><Lock className="mr-2 h-4 w-4" />Add private note</DropdownMenuItem>
                    <DropdownMenuItem onClick={() => setActiveTab('activity')}><MessageSquare className="mr-2 h-4 w-4" />View activity</DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            )}
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="flex min-h-0 flex-1 flex-col">
          <TabsList className="border-b border-border px-5 pt-2">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="cursor-pointer capitalize"
                onClick={() => setActiveTab(tab)}
              >
                {tab === 'bookslot'
                  ? 'Book Slot'
                  : tab === 'notes'
                    ? 'Internal Notes'
                    : tab}
              </TabsTrigger>
            ))}
          </TabsList>

          <div className="min-h-0 flex-1 overflow-y-auto p-5">
            <TabsContent value="overview" className="mt-0">
              <div className="grid gap-5 lg:grid-cols-[1.8fr_1fr]">
                <div className="space-y-5">
                  <div className="rounded-lg border-l-4 border-teal-500 bg-teal-500/10 p-4">
                    <p className="mb-2 text-xs font-semibold text-teal-500">Why is {candidate.name} a great fit?</p>
                    <p className="text-sm leading-relaxed text-muted-foreground">{summary}</p>
                  </div>

                  <div>
                    <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">Skills</p>
                    <div className="flex flex-wrap gap-2">
                      {candidate.parsedData?.skills?.map((skill) => <Badge key={skill.name} variant="secondary" className="text-xs">{skill.name}</Badge>)}
                    </div>
                  </div>

                  <div className="rounded-lg border border-border">
                    <div className="border-b border-border px-4 py-3">
                      <p className="text-sm font-semibold">Screening Q&amp;A</p>
                    </div>
                    <div className="space-y-0">
                      {roleQuestions.length ? roleQuestions.map((question) => {
                        const answer = screeningAnswers.find((item) => item.question === question.question)?.answer
                        return (
                          <div key={question.id} className="border-b border-border px-4 py-3 last:border-0">
                            <p className="text-sm font-medium">{question.question}</p>
                            <p className="mt-1 text-sm text-muted-foreground">{answer || 'No parsed answer available'}</p>
                          </div>
                        )
                      }) : <div className="px-4 py-3 text-sm text-muted-foreground">No screening questions found for this role.</div>}
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-3 rounded-lg border border-border p-4">
                    <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Candidate Info</p>
                    {candidate.candidateEmail && <div className="flex items-center gap-2 text-sm"><Mail className="h-3.5 w-3.5 text-muted-foreground" /><span>{candidate.candidateEmail}</span></div>}
                    {candidate.phone && <div className="flex items-center gap-2 text-sm"><Phone className="h-3.5 w-3.5 text-muted-foreground" /><span>{candidate.phone}</span></div>}
                    {(candidate.parsedData?.salary || candidate.parsedData?.salaryExpectation) && <div className="flex items-center gap-2 text-sm"><DollarSign className="h-3.5 w-3.5 text-muted-foreground" /><span>{candidate.parsedData?.salary || candidate.parsedData?.salaryExpectation}</span></div>}
                    <div className="border-t border-border pt-2">
                      <p className="text-xs text-muted-foreground">Submitted: {format(new Date(candidate.createdAt), 'MMM d, yyyy · h:mm a')}</p>
                    </div>
                    {candidate.resumeUrl && <a href={candidate.resumeUrl} target="_blank" className="flex items-center gap-1 text-sm text-primary hover:underline"><Download className="h-3.5 w-3.5" />Download Resume</a>}
                  </div>

                  <div className="rounded-lg border border-border p-4">
                    <p className="mb-3 text-sm font-semibold">Interview Schedule</p>
                    {scheduledInterview ? (
                      <div className="space-y-2">
                        <p className="text-sm font-medium">{format(new Date(scheduledInterview.scheduledStartTime || scheduledInterview.scheduledAt || new Date()), 'EEEE, MMM d · h:mm a')}</p>
                        <p className="text-xs text-muted-foreground">with {scheduledInterview.interviewerEmail}</p>
                        {scheduledInterview.meetLink && <a href={scheduledInterview.meetLink} target="_blank" className="inline-flex items-center gap-1 text-xs text-green-500 hover:underline"><Video className="h-3 w-3" />Join Google Meet</a>}
                      </div>
                    ) : (
                      <div>
                        <p className="mb-3 text-sm text-muted-foreground">No interview scheduled</p>
                        {!isInterviewer && <Button size="sm" className="w-full" onClick={() => setActiveTab('bookslot')}>Book Interview</Button>}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="linkedin" className="mt-0 space-y-6">
              <div className="flex items-center justify-between">
                <h3 className="text-base font-semibold">Experiences</h3>
                {(candidate.linkedinUrl || candidate.parsedData?.socials?.linkedin) && (
                  <a href={candidate.linkedinUrl || candidate.parsedData?.socials?.linkedin} target="_blank">
                    <Button variant="outline" size="sm">LinkedIn ↗</Button>
                  </a>
                )}
              </div>
              {(candidate.parsedData?.experience || []).map((exp, index) => (
                <div key={`${exp.company}-${index}`} className="flex gap-4 border-b border-border pb-6 last:border-0">
                  <div className="mt-1 flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-muted text-sm font-bold">{exp.company?.charAt(0) || '?'}</div>
                  <div className="flex-1">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <p className="text-sm font-semibold">{exp.company}</p>
                        <p className="text-sm text-primary">{exp.title}</p>
                        <p className="mt-0.5 text-xs text-muted-foreground">{exp.duration}{exp.location ? ` · ${exp.location}` : ''}</p>
                      </div>
                    </div>
                    {exp.description && <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-muted-foreground">{exp.description}</p>}
                    <div className="mt-2 flex flex-wrap gap-1.5">
                      {exp.technologies?.map((tech) => <Badge key={tech} variant="secondary" className="px-2 py-0 text-xs">{tech}</Badge>)}
                    </div>
                  </div>
                </div>
              ))}
              <h3 className="text-base font-semibold">Education</h3>
              {(candidate.parsedData?.education || []).map((edu, index) => (
                <div key={`${edu.institution}-${index}`} className="flex gap-4 border-b border-border pb-4 last:border-0">
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-lg bg-blue-500/20 text-sm font-bold text-blue-500">Ed</div>
                  <div>
                    <p className="text-sm font-semibold">{edu.institution}</p>
                    <p className="text-sm text-muted-foreground">{edu.degree}</p>
                    <p className="text-xs text-muted-foreground">{edu.year}{edu.grade ? ` · ${edu.grade}` : ''}</p>
                  </div>
                </div>
              ))}
            </TabsContent>

            <TabsContent value="resume" className="mt-0 h-full">
              <div className="flex h-full flex-col">
                <div className="flex flex-shrink-0 items-center justify-end gap-2 border-b border-border pb-3">
                  <button onClick={() => setZoom((value) => Math.max(50, value - 25))} className="flex h-7 w-7 items-center justify-center rounded border border-border hover:bg-muted">-</button>
                  <span className="w-12 text-center text-sm text-muted-foreground">{zoom}%</span>
                  <button onClick={() => setZoom((value) => Math.min(200, value + 25))} className="flex h-7 w-7 items-center justify-center rounded border border-border hover:bg-muted">+</button>
                  {candidate.resumeUrl && <a href={candidate.resumeUrl} target="_blank" download><Button variant="outline" size="sm"><Download className="mr-1 h-3.5 w-3.5" />Download</Button></a>}
                </div>
                <div className="mt-3 flex-1 overflow-auto">
                  <div style={{ transform: `scale(${zoom / 100})`, transformOrigin: 'top center' }}>
                    {candidate.resumeUrl ? <iframe src={getDriveEmbedUrl(candidate.resumeUrl)} className="w-full rounded-lg bg-white shadow-lg" style={{ height: '700px', border: 'none' }} title="Resume" /> : <div className="flex h-64 items-center justify-center text-muted-foreground"><p>No resume available</p></div>}
                  </div>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="activity" className="mt-0">
              <div className="space-y-0">
                {activities.map((activity, index) => (
                  <div key={activity.id} className="relative flex gap-3 pb-4">
                    {index < activities.length - 1 && <div className="absolute left-4 top-8 bottom-0 w-px bg-border" />}
                    <div className={cn('z-10 flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full text-xs font-bold text-white', activityColors[activity.type] || 'bg-muted')}>
                      {activity.actorInitials || 'SY'}
                    </div>
                    <div className="flex-1 pt-1">
                      <p className="text-sm leading-snug text-foreground">{activity.message || activity.text}</p>
                      <p className="mt-1 text-xs text-muted-foreground">{formatDistanceToNow(new Date(activity.timestamp))} ago</p>
                    </div>
                  </div>
                ))}
              </div>
            </TabsContent>

            {!isInterviewer && (
              <TabsContent value="scorecards" className="mt-0">
                {(!roleQuestions || roleQuestions.length === 0) ? (
                  <div className="text-center py-12">
                    <div className="w-12 h-12 rounded-full bg-muted flex items-center justify-center mx-auto mb-4">
                      <ClipboardList className="w-5 h-5 text-muted-foreground" />
                    </div>
                    <p className="text-sm font-medium mb-1">No screening criteria for this role</p>
                    <p className="text-xs text-muted-foreground mb-4">Add screening questions to the "{candidate?.role}" role to enable scorecards.</p>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        window.location.href = '/roles'
                      }}
                    >
                      Configure role criteria →
                    </Button>
                  </div>
                ) : (
                  <div className="overflow-hidden rounded-lg border border-border">
                    <div className="border-b border-border bg-muted/50 px-4 py-3">
                      <p className="text-sm font-semibold">Screening criteria</p>
                      <p className="mt-0.5 text-xs text-muted-foreground">Auto-saved</p>
                    </div>
                    {roleQuestions.map((question) => (
                      <div key={question.id} className="flex items-center gap-3 border-b border-border px-4 py-3 last:border-0">
                        <p className="flex-1 text-sm leading-snug">{question.question}</p>
                        <div className="flex items-center gap-2">
                          {[
                            { key: 'unknown', label: '?' },
                            { key: 'no', label: '✕' },
                            { key: 'yes', label: '✓' },
                          ].map((option) => (
                            <button
                              key={option.key}
                              onClick={() => setAnswers((current) => ({ ...current, [question.id]: option.key as 'yes' | 'no' | 'unknown' }))}
                              className={cn(
                                'flex h-7 w-7 items-center justify-center rounded-full border text-xs transition-all',
                                answers[question.id] === option.key
                                  ? option.key === 'yes'
                                    ? 'border-green-500 bg-green-500 text-white'
                                    : option.key === 'no'
                                      ? 'border-red-500 bg-red-500 text-white'
                                      : 'border-muted-foreground bg-muted text-foreground'
                                  : 'border-border text-muted-foreground',
                              )}
                            >
                              {option.label}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <div className="flex gap-0 border-t border-border p-3">
                      {['poor_fit', 'ok_fit', 'good_fit', 'excellent_fit'].map((fit) => (
                        <button key={fit} onClick={() => setOverallFit(fit)} className={cn('first:ml-0 -ml-px flex-1 border border-border py-2 text-xs font-medium first:rounded-l-md last:rounded-r-md', overallFit === fit ? 'z-10 border-green-500 bg-green-500/10 text-green-500' : 'text-muted-foreground hover:bg-muted')}>
                          {fit.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase())}
                        </button>
                      ))}
                    </div>
                  </div>
                )}
              </TabsContent>
            )}

            <TabsContent value="notes" className="mt-0 space-y-4">
              <div className="flex gap-2 rounded-lg border border-blue-500/20 bg-blue-500/10 px-4 py-3 text-sm text-blue-500">
                <Info className="mt-0.5 h-4 w-4 flex-shrink-0" />
                Add internal notes for your team's reference. Recruiters will not see these.
              </div>
              <div className="overflow-hidden rounded-lg border border-border">
                <Textarea value={noteText} onChange={(e) => setNoteText(e.target.value)} placeholder="Add a note..." className="min-h-[120px] resize-none border-0 rounded-none focus-visible:ring-0" />
              </div>
              <div className="flex items-center justify-end gap-3">
                <span className="rounded bg-muted px-2 py-1 text-xs text-muted-foreground">Cmd/Ctrl + Enter to add</span>
                <Button size="sm" onClick={() => addNoteMutation.mutate()} disabled={!noteText.trim() || addNoteMutation.isPending}>
                  {addNoteMutation.isPending ? <Loader2 className="mr-1 h-3 w-3 animate-spin" /> : null}
                  Add note
                </Button>
              </div>
              <div className="mt-4 space-y-3">
                {notes.map((note) => (
                  <div key={note.id} className="rounded-lg border border-border p-4">
                    <div className="mb-2 flex items-center gap-2">
                      <div className="flex h-6 w-6 items-center justify-center rounded-full bg-primary text-xs font-bold text-white">{note.authorName?.charAt(0) || 'T'}</div>
                      <span className="text-xs font-medium">{note.authorName}</span>
                      <span className="ml-auto text-xs text-muted-foreground">{formatDistanceToNow(new Date(note.createdAt))} ago</span>
                    </div>
                    <p className="text-sm leading-relaxed text-muted-foreground">{note.text}</p>
                  </div>
                ))}
              </div>
            </TabsContent>

            <TabsContent value="bookslot" className="mt-0">
              <BookSlotTab
                candidate={candidate}
                onBooked={() => {
                  queryClient.invalidateQueries({ queryKey: ['candidate-interviews', candidate.id] })
                  queryClient.invalidateQueries({ queryKey: ['candidates', filters] })
                }}
              />
            </TabsContent>

            <TabsContent value="feedback" className="mt-0">
              <div className="space-y-4">
                {feedback.length ? feedback.map((item: any) => (
                  <div key={item.id} className="rounded-lg border border-border p-4">
                    <p className="text-sm font-semibold">{item.interviewerEmail}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{item.notes || item.strengths || 'Feedback submitted.'}</p>
                  </div>
                )) : <p className="text-sm text-muted-foreground">No feedback submitted yet.</p>}
              </div>
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </>
  )
}

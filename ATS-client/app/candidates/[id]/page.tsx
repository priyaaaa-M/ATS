'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  ArrowLeft,
  Calendar,
  Check,
  Code2,
  GraduationCap,
  Mail,
  Phone,
  Star,
  Video,
} from 'lucide-react'
import { toast } from 'sonner'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import {
  calendarApi,
  candidatesApi,
  interviewsApi,
  transcriptApi,
} from '@/lib/api'
import { addMinutes, cn, formatDate, formatDateTime } from '@/lib/utils'

const statusColors: Record<string, string> = {
  pending: 'bg-warning/20 text-warning border-warning/30',
  hr_approved: 'bg-info/20 text-info border-info/30',
  scheduled: 'bg-primary/20 text-primary border-primary/30',
  selected: 'bg-success/20 text-success border-success/30',
  rejected: 'bg-destructive/20 text-destructive border-destructive/30',
}

export default function CandidateDetailPage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const candidateId = params.id as string
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [duration, setDuration] = useState(45)
  const [manualTranscript, setManualTranscript] = useState('')
  const [manualSummary, setManualSummary] = useState('')

  const { data: candidate, isLoading, isError, refetch } = useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: () => candidatesApi.getById(candidateId),
    enabled: Boolean(candidateId),
  })

  const { data: interviews = [] } = useQuery({
    queryKey: ['candidate-interviews', candidateId],
    queryFn: () => interviewsApi.getByCandidateId(candidateId),
    enabled: Boolean(candidateId),
  })

  const currentInterview = interviews[0] || null

  const { data: transcript } = useQuery({
    queryKey: ['transcript', candidateId, candidate?.current_round],
    queryFn: () =>
      transcriptApi.getByRound(candidateId, candidate?.current_round || 1),
    enabled: Boolean(candidateId && candidate?.current_round),
  })

  const { data: slotsData, isLoading: isLoadingSlots } = useQuery({
    queryKey: [
      'free-slots',
      candidate?.assigned_interviewer_email,
      selectedDate,
      duration,
    ],
    queryFn: () =>
      calendarApi.getFreeSlots({
        date: selectedDate,
        interviewerEmail: candidate?.assigned_interviewer_email || '',
        durationMinutes: duration,
      }),
    enabled: Boolean(selectedDate && candidate?.assigned_interviewer_email),
  })

  const approveMutation = useMutation({
    mutationFn: candidatesApi.approve,
    onSuccess: () => {
      toast.success('Candidate approved')
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })

  const rejectMutation = useMutation({
    mutationFn: candidatesApi.reject,
    onSuccess: () => {
      toast.success('Candidate rejected')
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
  })

  const bookMutation = useMutation({
    mutationFn: interviewsApi.book,
    onSuccess: (data) => {
      toast.success(`Interview scheduled${data.meetLink ? `: ${data.meetLink}` : ''}`)
      queryClient.invalidateQueries({ queryKey: ['candidate-interviews', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['candidate', candidateId] })
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      setSelectedSlot('')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to schedule interview')
    },
  })

  const saveTranscriptMutation = useMutation({
    mutationFn: transcriptApi.saveManual,
    onSuccess: () => {
      toast.success('Transcript saved')
      queryClient.invalidateQueries({ queryKey: ['transcript', candidateId, candidate?.current_round] })
      setManualTranscript('')
      setManualSummary('')
    },
  })

  const triggerFetchMutation = useMutation({
    mutationFn: transcriptApi.triggerFetch,
    onSuccess: () => {
      toast.success('Transcript fetch triggered')
    },
  })

  const initials = useMemo(
    () =>
      (candidate?.name || 'Candidate')
        .split(' ')
        .map((part) => part[0])
        .join('')
        .slice(0, 2)
        .toUpperCase(),
    [candidate?.name]
  )

  if (isLoading) {
    return (
      <AppShell>
        <div className="space-y-6">
          <Skeleton className="h-48 bg-surface-2" />
          <Skeleton className="h-96 bg-surface-2" />
        </div>
      </AppShell>
    )
  }

  if (isError || !candidate) {
    return (
      <AppShell>
        <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
          Failed to load candidate details.
          <Button variant="link" onClick={() => refetch()} className="px-2">
            Retry
          </Button>
        </div>
      </AppShell>
    )
  }

  return (
    <AppShell>
      <div className="space-y-6">
        <Button variant="ghost" onClick={() => router.back()} className="w-fit">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back
        </Button>

        <Card className="overflow-hidden border-border bg-surface">
          <div className="h-2 w-full bg-gradient-to-r from-primary/40 to-primary" />
          <CardContent className="p-6">
            <div className="flex flex-col gap-6 md:flex-row md:items-start md:justify-between">
              <div className="flex items-center gap-4">
                <Avatar className="h-20 w-20 text-2xl">
                  <AvatarFallback className="bg-primary text-primary-foreground">
                    {initials}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-2">
                  <h1 className="font-[Syne] text-2xl font-bold">{candidate.name}</h1>
                  <div className="flex flex-wrap gap-2">
                    <Badge>{candidate.role}</Badge>
                    <Badge variant="outline" className={cn(statusColors[candidate.status])}>
                      {candidate.status.replace('_', ' ')}
                    </Badge>
                  </div>
                  <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Mail className="h-4 w-4" />
                      {candidate.email || 'No email'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Phone className="h-4 w-4" />
                      {candidate.phone || 'No phone'}
                    </span>
                    <span className="flex items-center gap-1">
                      <Calendar className="h-4 w-4" />
                      Added {formatDate(candidate.created_at)}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex flex-wrap gap-2">
                <Badge className="bg-primary/10 text-primary border-primary/20">
                  <Star className="mr-1 h-3 w-3" />
                  ATS {candidate.ats_score}
                </Badge>
                {candidate.status === 'pending' ? (
                  <>
                    <Button onClick={() => approveMutation.mutate(candidate.id)}>
                      <Check className="mr-2 h-4 w-4" />
                      Approve
                    </Button>
                    <Button
                      variant="outline"
                      className="border-destructive text-destructive"
                      onClick={() => rejectMutation.mutate(candidate.id)}
                    >
                      Reject
                    </Button>
                  </>
                ) : null}
              </div>
            </div>
          </CardContent>
        </Card>

        <Tabs defaultValue="overview" className="space-y-4">
          <TabsList className="flex h-auto flex-wrap gap-2 bg-transparent p-0">
            {['overview', 'experience', 'education', 'skills', 'projects', 'interview', 'transcript'].map((tab) => (
              <TabsTrigger
                key={tab}
                value={tab}
                className="border border-border bg-surface data-[state=active]:bg-primary data-[state=active]:text-primary-foreground"
              >
                {tab[0].toUpperCase() + tab.slice(1)}
              </TabsTrigger>
            ))}
          </TabsList>

          <TabsContent value="overview">
            <div className="grid gap-4 md:grid-cols-3">
              <Card className="bg-surface border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">
                    {candidate.parsed_data.experience.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Experience Entries</p>
                </CardContent>
              </Card>
              <Card className="bg-surface border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">
                    {candidate.parsed_data.skills.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Skills</p>
                </CardContent>
              </Card>
              <Card className="bg-surface border-border">
                <CardContent className="p-4 text-center">
                  <p className="text-3xl font-bold text-primary">
                    {candidate.parsed_data.projects.length}
                  </p>
                  <p className="text-sm text-muted-foreground">Projects</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="experience">
            <div className="space-y-4">
              {candidate.parsed_data.experience.map((experience, index) => (
                <Card key={`${experience.company}-${index}`} className="bg-surface border-border">
                  <CardContent className="p-4">
                    <p className="font-semibold">{experience.company}</p>
                    <p className="text-sm text-primary">{experience.title}</p>
                    <p className="text-sm text-muted-foreground">{experience.duration}</p>
                    <p className="mt-2 text-sm text-muted-foreground">{experience.description}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="education">
            <div className="grid gap-4 md:grid-cols-2">
              {candidate.parsed_data.education.map((education, index) => (
                <Card key={`${education.institution}-${index}`} className="bg-surface border-border">
                  <CardContent className="flex gap-4 p-4">
                    <div className="flex h-12 w-12 items-center justify-center rounded-lg bg-primary/10">
                      <GraduationCap className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <p className="font-semibold">{education.institution}</p>
                      <p className="text-sm text-muted-foreground">{education.degree}</p>
                      <p className="text-xs text-muted-foreground">
                        {education.year} • {education.grade}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="skills">
            <Card className="bg-surface border-border">
              <CardContent className="flex flex-wrap gap-2 p-6">
                {candidate.parsed_data.skills.map((skill, index) => (
                  <Badge key={`${skill.name}-${index}`} variant="outline">
                    {skill.name}
                  </Badge>
                ))}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="projects">
            <div className="grid gap-4 md:grid-cols-2">
              {candidate.parsed_data.projects.map((project, index) => (
                <Card key={`${project.name}-${index}`} className="bg-surface border-border">
                  <CardContent className="p-4">
                    <div className="mb-3 flex items-start gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                        <Code2 className="h-5 w-5 text-primary" />
                      </div>
                      <div>
                        <p className="font-[Syne] font-semibold">{project.name}</p>
                        <p className="text-sm text-muted-foreground">{project.description}</p>
                      </div>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {project.tech.map((tech, techIndex) => (
                        <Badge key={`${tech}-${techIndex}`} variant="secondary">
                          {tech}
                        </Badge>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          </TabsContent>

          <TabsContent value="interview">
            <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle>Book Slot</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                      <Label>Date</Label>
                      <Input
                        type="date"
                        value={selectedDate}
                        onChange={(event) => {
                          setSelectedDate(event.target.value)
                          setSelectedSlot('')
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Duration (minutes)</Label>
                      <Input
                        type="number"
                        value={duration}
                        onChange={(event) => setDuration(Number(event.target.value))}
                      />
                    </div>
                  </div>

                  <div className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
                    <p>
                      <strong>Interviewer:</strong>{' '}
                      {candidate.assigned_interviewer_email || 'Not assigned yet'}
                    </p>
                  </div>

                  {isLoadingSlots ? (
                    <Skeleton className="h-24 bg-surface-2" />
                  ) : (
                    <div className="flex flex-wrap gap-2">
                      {(slotsData?.freeSlots || []).map((slot: any) => {
                        const start = new Date(slot.start)
                        const formatted = `${String(start.getHours()).padStart(2, '0')}:${String(
                          start.getMinutes()
                        ).padStart(2, '0')}`
                        return (
                          <Button
                            key={slot.start}
                            type="button"
                            variant={selectedSlot === formatted ? 'default' : 'outline'}
                            onClick={() => setSelectedSlot(formatted)}
                          >
                            {formatted}
                          </Button>
                        )
                      })}
                      {selectedDate && !isLoadingSlots && (slotsData?.freeSlots || []).length === 0 ? (
                        <p className="text-sm text-muted-foreground">No free slots available for that day.</p>
                      ) : null}
                    </div>
                  )}

                  <Button
                    disabled={
                      bookMutation.isPending ||
                      !candidate.assigned_interviewer_email ||
                      !selectedDate ||
                      !selectedSlot
                    }
                    onClick={() =>
                      bookMutation.mutate({
                        candidateId: candidate.id,
                        candidateEmail: candidate.email,
                        interviewerEmail: candidate.assigned_interviewer_email || '',
                        date: selectedDate,
                        startTime: selectedSlot,
                        endTime: addMinutes(selectedSlot, duration),
                        roleName: candidate.role,
                        roundNumber: candidate.current_round,
                        durationMinutes: duration,
                      })
                    }
                  >
                    <Video className="mr-2 h-4 w-4" />
                    Confirm Booking
                  </Button>
                </CardContent>
              </Card>

              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle>Current Interview</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3 text-sm">
                  {currentInterview ? (
                    <>
                      <p>
                        <strong>Round:</strong> {currentInterview.round}
                      </p>
                      <p>
                        <strong>When:</strong> {formatDateTime(currentInterview.scheduled_at)}
                      </p>
                      <p>
                        <strong>Status:</strong> {currentInterview.status}
                      </p>
                      {currentInterview.meet_link ? (
                        <a
                          href={currentInterview.meet_link}
                          target="_blank"
                          rel="noreferrer"
                          className="text-primary underline"
                        >
                          Open Meet Link
                        </a>
                      ) : null}
                    </>
                  ) : (
                    <p className="text-muted-foreground">No interview scheduled yet.</p>
                  )}
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="transcript">
            <div className="grid gap-6 lg:grid-cols-[1fr_0.9fr]">
              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle>Transcript</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  {transcript ? (
                    <>
                      <p className="text-sm text-muted-foreground">
                        Received {formatDateTime(transcript.received_at)}
                      </p>
                      {transcript.summary ? (
                        <div className="rounded-xl border border-border bg-surface-2 p-4">
                          <p className="font-medium">Summary</p>
                          <p className="mt-2 text-sm text-muted-foreground">{transcript.summary}</p>
                        </div>
                      ) : null}
                      <Textarea readOnly value={transcript.transcript_text || ''} className="min-h-72" />
                    </>
                  ) : (
                    <p className="text-sm text-muted-foreground">No transcript available yet.</p>
                  )}
                </CardContent>
              </Card>

              <Card className="bg-surface border-border">
                <CardHeader>
                  <CardTitle>Manual Save / Fetch</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label>Summary</Label>
                    <Input value={manualSummary} onChange={(event) => setManualSummary(event.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <Label>Transcript Text</Label>
                    <Textarea
                      value={manualTranscript}
                      onChange={(event) => setManualTranscript(event.target.value)}
                      className="min-h-40"
                    />
                  </div>
                  <div className="flex flex-wrap gap-3">
                    <Button
                      onClick={() =>
                        saveTranscriptMutation.mutate({
                          candidateId,
                          roundNumber: candidate.current_round,
                          transcriptText: manualTranscript,
                          summary: manualSummary || undefined,
                        })
                      }
                      disabled={saveTranscriptMutation.isPending || !manualTranscript}
                    >
                      Save Manual Transcript
                    </Button>
                    {currentInterview ? (
                      <Button
                        variant="outline"
                        onClick={() => triggerFetchMutation.mutate(currentInterview.id)}
                        disabled={triggerFetchMutation.isPending}
                      >
                        Trigger Read.ai Fetch
                      </Button>
                    ) : null}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </AppShell>
  )
}

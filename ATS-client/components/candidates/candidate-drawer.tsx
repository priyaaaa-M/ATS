'use client'

import { useMutation, useQueryClient, useQuery } from '@tanstack/react-query'
import { AnimatePresence, motion } from 'framer-motion'
import { 
  Briefcase, 
  Check, 
  Github, 
  Globe, 
  GraduationCap, 
  Linkedin, 
  Mail, 
  Phone, 
  Star, 
  X,
  Calendar,
  Clock,
  Video,
  Loader2,
  RefreshCcw,
  User,
  History
} from 'lucide-react'
import { toast } from 'sonner'
import { useState } from 'react'
import { candidatesApi } from '@/lib/api/candidates'
import { calendarApi } from '@/lib/api/calendar'
import { interviewsApi } from '@/lib/api/interviews'
import type { Candidate } from '@/lib/types'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { cn, addMinutes } from '@/lib/utils'

interface CandidateDrawerProps {
  candidate: Candidate | null
  onClose: () => void
  funnelStages?: { id: string; label: string; color: string }[]
}

const statusLabel: Record<string, string> = {
  pending: 'AI Parsing',
  hr_approved: 'HR Review',
  scheduled: 'Interviewing',
  selected: 'Selected',
  rejected: 'Rejected',
}

const roundStatusColor: Record<string, string> = {
  pending: 'bg-amber-500/10 text-amber-600',
  scheduled: 'bg-blue-500/10 text-blue-600',
  interviewing: 'bg-purple-500/10 text-purple-600',
  completed: 'bg-emerald-500/10 text-emerald-600',
  cancelled: 'bg-rose-500/10 text-rose-600',
}

export function CandidateDrawer({ candidate, onClose, funnelStages = [] }: CandidateDrawerProps) {
  const queryClient = useQueryClient()
  const [selectedTab, setSelectedTab] = useState('overview')
  const [selectedDate, setSelectedDate] = useState('')
  const [selectedSlot, setSelectedSlot] = useState('')
  const [duration, setDuration] = useState(45)

  const approveMutation = useMutation({
    mutationFn: (id: string) => candidatesApi.hrAdvance(id),
    onSuccess: () => {
      toast.success('Candidate advanced to next stage')
      queryClient.invalidateQueries({ queryKey: ['dashboard-candidates'] })
      onClose()
    },
    onError: () => toast.error('Failed to advance candidate'),
  })

  const rejectMutation = useMutation({
    mutationFn: candidatesApi.reject,
    onSuccess: () => {
      toast.success('Candidate rejected')
      queryClient.invalidateQueries({ queryKey: ['dashboard-candidates'] })
      onClose()
    },
    onError: () => toast.error('Failed to reject candidate'),
  })

  const { 
    data: slotsData, 
    isLoading: isLoadingSlots, 
    isError: isSlotsError, 
    error: slotsFetchError 
  } = useQuery({
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
    enabled: Boolean(selectedDate && candidate?.assigned_interviewer_email && selectedTab === 'book'),
    retry: false,
  })
  
  const slotsError = (slotsData as any)?.error || null;

  const bookMutation = useMutation({
    mutationFn: interviewsApi.book,
    onSuccess: (data) => {
      toast.success(`Interview scheduled${data.meetLink ? `: ${data.meetLink}` : ''}`)
      queryClient.invalidateQueries({ queryKey: ['dashboard-candidates'] })
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      setSelectedSlot('')
      onClose()
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to schedule interview')
    },
  })

  const socials = (candidate?.parsed_data as any)?.socials

  const initials = (candidate?.name || 'C')
    .split(' ')
    .map((p: string) => p[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()

  const scoreColor =
    (candidate?.ats_score || 0) >= 85
      ? 'text-emerald-500'
      : (candidate?.ats_score || 0) >= 70
      ? 'text-amber-500'
      : 'text-rose-500'

  return (
    <AnimatePresence>
      {candidate && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-40 bg-black/20 backdrop-blur-[2px]"
            onClick={onClose}
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: '100%', opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: '100%', opacity: 0 }}
            transition={{ type: 'spring', damping: 30, stiffness: 300 }}
            className="fixed right-0 top-0 h-full z-50 w-[480px] max-w-[95vw] bg-background shadow-2xl flex flex-col overflow-hidden border-l border-border/10"
          >
            {/* Header */}
            <div className="p-6 border-b border-border/10 flex items-start justify-between gap-4 shrink-0">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-primary/10 flex items-center justify-center text-primary font-black text-lg">
                  {initials}
                </div>
                <div>
                  <h2 className="text-xl font-black tracking-tight">{candidate.name}</h2>
                  <div className="flex flex-wrap gap-1.5 mt-1.5">
                    <Badge className="bg-secondary/80 text-foreground border-none text-[11px] font-bold">
                      {candidate.role}
                    </Badge>
                    <Badge className="bg-primary/10 text-primary border-none text-[11px] font-bold">
                      {statusLabel[candidate.status] || candidate.status}
                    </Badge>
                    {candidate.status === 'scheduled' && (
                      <Badge className={cn('border-none text-[10px] font-black uppercase tracking-tighter', roundStatusColor[candidate.round_status || 'pending'])}>
                        {candidate.round_status || 'Pending'}
                      </Badge>
                    )}
                    <Badge className={cn('border-none text-[11px] font-black', scoreColor, 'bg-transparent ring-1 ring-current/20')}>
                      <Star className="h-3 w-3 mr-1" />
                      ATS {candidate.ats_score}
                    </Badge>
                  </div>
                </div>
              </div>
              <button
                onClick={onClose}
                className="h-9 w-9 rounded-xl flex items-center justify-center hover:bg-secondary/60 transition-colors text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Tabs Header */}
            <div className="px-6 border-b border-border/10 shrink-0">
              <div className="flex gap-6">
                {['overview', 'timeline', 'book', 'feedback'].map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setSelectedTab(tab)}
                    className={cn(
                      "py-4 text-[13px] font-bold capitalize transition-all border-b-2",
                      selectedTab === tab 
                        ? "text-foreground border-foreground" 
                        : "text-muted-foreground border-transparent hover:text-foreground"
                    )}
                  >
                    {tab === 'book' ? 'Book Slot' : tab}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable body */}
            <div className="flex-1 overflow-y-auto scrollbar-none bg-secondary/5">
              <AnimatePresence mode="wait">
                <motion.div
                  key={selectedTab}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -10 }}
                  transition={{ duration: 0.2 }}
                  className="p-6 space-y-8"
                >
                  {selectedTab === 'overview' && (
                    <>
                      {/* Contact info */}
                      <div className="flex flex-wrap gap-3 text-sm text-muted-foreground">
                        {candidate.email && (
                          <span className="flex items-center gap-1.5">
                            <Mail className="h-4 w-4" /> {candidate.email}
                          </span>
                        )}
                        {candidate.phone && (
                          <span className="flex items-center gap-1.5">
                            <Phone className="h-4 w-4" /> {candidate.phone}
                          </span>
                        )}
                        {socials?.linkedin && (
                          <a
                            href={`https://${socials.linkedin.replace(/^https?:\/\//, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-primary hover:underline"
                          >
                            <Linkedin className="h-4 w-4" /> LinkedIn
                          </a>
                        )}
                        {socials?.github && (
                          <a
                            href={`https://${socials.github.replace(/^https?:\/\//, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-primary hover:underline"
                          >
                            <Github className="h-4 w-4" /> GitHub
                          </a>
                        )}
                        {socials?.portfolio && (
                          <a
                            href={`https://${socials.portfolio.replace(/^https?:\/\//, '')}`}
                            target="_blank"
                            rel="noreferrer"
                            className="flex items-center gap-1.5 text-primary hover:underline"
                          >
                            <Globe className="h-4 w-4" /> Portfolio
                          </a>
                        )}
                      </div>

                      {/* Education */}
                      {candidate.parsed_data?.education?.length > 0 && (
                        <div className="space-y-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                            Education
                          </p>
                          <div className="grid grid-cols-2 gap-3">
                            {candidate.parsed_data.education.map((edu, i) => (
                              <div key={i} className="bg-card rounded-[1.5rem] p-5 shadow-sm space-y-1">
                                <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider">Degree</p>
                                <p className="font-bold text-sm leading-tight">{edu.degree || 'Not specified'}</p>
                                <p className="text-[11px] text-muted-foreground/60 font-bold uppercase tracking-wider mt-3">College</p>
                                <p className="font-bold text-sm leading-tight truncate">{edu.institution || 'Not specified'}</p>
                                <p className="text-xs text-muted-foreground mt-2">{edu.year}{edu.grade ? ` · ${edu.grade}` : ''}</p>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Experience */}
                      {candidate.parsed_data?.experience?.length > 0 && (
                        <div className="space-y-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                            Experience
                          </p>
                          <div className="space-y-3">
                            {candidate.parsed_data.experience.map((exp, i) => (
                              <div key={i} className="bg-card rounded-[1.5rem] p-5 shadow-sm flex gap-4 items-start group">
                                <div className="mt-1 w-1.5 h-12 rounded-full bg-primary/20 group-hover:bg-primary transition-colors shrink-0" />
                                <div>
                                  <p className="font-bold text-[15px]">{exp.title} — <span className="text-muted-foreground font-semibold">{exp.company}</span></p>
                                  <p className="text-sm text-muted-foreground mt-1">{exp.duration}</p>
                                  {(exp as any).technologies?.length > 0 && (
                                    <p className="text-xs text-muted-foreground/50 mt-1.5">{(exp as any).technologies.join(' · ')}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      )}

                      {/* Skills */}
                      {candidate.parsed_data?.skills?.length > 0 && (
                        <div className="space-y-4">
                          <p className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                            Skills
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {candidate.parsed_data.skills.slice(0, 25).map((skill, i) => (
                              <span
                                key={i}
                                className="px-4 py-2 rounded-xl bg-card text-foreground text-[12px] font-bold shadow-sm border border-border/5"
                              >
                                {skill.name}
                              </span>
                            ))}
                          </div>
                        </div>
                      )}
                    </>
                  )}

                  {selectedTab === 'book' && (
                    <div className="space-y-6">
                      <Card className="bg-card border-none shadow-sm rounded-[2rem] overflow-hidden">
                        <CardHeader className="p-6 pb-0">
                          <CardTitle className="text-xl font-black tracking-tight">Schedule Interview</CardTitle>
                        </CardHeader>
                        <CardContent className="p-6 space-y-6">
                          <div className="grid gap-6">
                            <div className="space-y-2">
                              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Select Date</Label>
                              <div className="relative">
                                <Input
                                  type="date"
                                  value={selectedDate}
                                  onChange={(event) => {
                                    setSelectedDate(event.target.value)
                                    setSelectedSlot('')
                                  }}
                                  className="h-12 rounded-2xl bg-secondary/10 border-transparent focus:bg-background transition-all font-bold px-4"
                                />
                              </div>
                            </div>
                            <div className="space-y-2">
                              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60 ml-1">Duration (minutes)</Label>
                              <Input
                                type="number"
                                value={duration}
                                onChange={(event) => setDuration(Number(event.target.value))}
                                className="h-12 rounded-2xl bg-secondary/10 border-transparent focus:bg-background transition-all font-bold px-4"
                              />
                            </div>
                          </div>

                          <div className="rounded-2xl border border-primary/10 bg-primary/5 p-4 space-y-1">
                            <p className="text-[10px] font-black uppercase tracking-widest text-primary/60">Assigned Interviewer</p>
                            <p className="font-bold text-sm">
                              {candidate.assigned_interviewer_email || 'Not assigned yet'}
                            </p>
                          </div>

                          <div className="space-y-3">
                            <div className="flex items-center justify-between ml-1">
                              <Label className="text-[11px] font-black uppercase tracking-widest text-muted-foreground/60">Available Slots</Label>
                              {slotsData?.workHours && (
                                <span className="text-[10px] font-bold text-primary/40 uppercase tracking-tighter">
                                  Work Hours: {slotsData.workHours}
                                </span>
                              )}
                            </div>
                            {isLoadingSlots ? (
                              <div className="h-24 flex items-center justify-center bg-secondary/5 rounded-2xl">
                                <Loader2 className="h-6 w-6 animate-spin text-primary/40" />
                              </div>
                            ) : (
                              <div className="grid grid-cols-3 gap-2">
                                {(slotsData?.freeSlots || []).map((slot: any) => {
                                  const start = new Date(slot.start)
                                  const formatted = `${String(start.getHours()).padStart(2, '0')}:${String(
                                    start.getMinutes()
                                  ).padStart(2, '0')}`
                                  return (
                                    <button
                                      key={slot.start}
                                      type="button"
                                      onClick={() => setSelectedSlot(formatted)}
                                      className={cn(
                                        "h-11 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2",
                                        selectedSlot === formatted 
                                          ? "bg-primary text-primary-foreground shadow-lg shadow-primary/20 scale-105" 
                                          : "bg-secondary/10 text-muted-foreground hover:bg-secondary/20"
                                      )}
                                    >
                                      <Clock className="h-3.5 w-3.5" />
                                      {formatted}
                                    </button>
                                  )
                                })}
                                {isSlotsError && (
                                  <div className="col-span-3 py-10 text-center bg-rose-500/5 rounded-3xl border-2 border-dashed border-rose-500/10">
                                    <X className="h-8 w-8 mx-auto mb-3 text-rose-500/40" />
                                    <p className="text-sm font-bold text-rose-600/80">Unable to load slots</p>
                                    <p className="text-[11px] text-rose-500/60 mt-1 max-w-[240px] mx-auto leading-relaxed">
                                      {(slotsFetchError as any)?.response?.data?.message || "Check if the interviewer has connected their Google Calendar and is a registered user."}
                                    </p>
                                  </div>
                                )}
                                {selectedDate && !isLoadingSlots && !isSlotsError && (slotsData?.freeSlots || []).length === 0 && (
                                  <div className="col-span-3 py-10 text-center bg-secondary/5 rounded-3xl border-2 border-dashed border-border/5">
                                    <Clock className="h-8 w-8 mx-auto mb-3 text-muted-foreground/20" />
                                    <p className="text-sm font-bold text-muted-foreground/60">No slots available</p>
                                    <p className="text-[11px] text-muted-foreground/40 mt-1 max-w-[200px] mx-auto">
                                      {new Date(selectedDate).toDateString() === new Date().toDateString() && new Date().getHours() >= 18
                                        ? "Working hours have ended for today. Please select a future date."
                                        : "The interviewer might be fully booked or hasn't connected their calendar."}
                                    </p>
                                  </div>
                                )}
                                {!selectedDate && (
                                  <div className="col-span-3 py-8 text-center bg-secondary/5 rounded-2xl border-2 border-dashed border-border/10">
                                    <p className="text-sm font-bold text-muted-foreground/40 uppercase tracking-widest">Select a date first</p>
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <Button
                            className="w-full h-14 rounded-2xl bg-foreground text-background font-black uppercase tracking-widest shadow-xl hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-50"
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
                                roundNumber: candidate.current_round || 1,
                                durationMinutes: duration,
                              })
                            }
                          >
                            {bookMutation.isPending ? (
                              <Loader2 className="h-5 w-5 animate-spin" />
                            ) : (
                              <>
                                <Video className="mr-2 h-5 w-5" />
                                Confirm Booking
                              </>
                            )}
                          </Button>
                        </CardContent>
                      </Card>
                    </div>
                  )}

                  {selectedTab === 'timeline' && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
                      <History className="h-12 w-12 mb-4" />
                      <p className="font-bold uppercase tracking-[0.2em] text-xs">Activity Coming Soon</p>
                    </div>
                  )}

                  {selectedTab === 'feedback' && (
                    <div className="flex flex-col items-center justify-center py-20 text-muted-foreground/40">
                      <Star className="h-12 w-12 mb-4" />
                      <p className="font-bold uppercase tracking-[0.2em] text-xs">No Feedback Yet</p>
                    </div>
                  )}
                </motion.div>
              </AnimatePresence>
            </div>

            {/* Footer action bar */}
            <div className="p-6 border-t border-border/10 bg-secondary/5 space-y-4 shrink-0">
              {/* Stage indicator */}
              {funnelStages.length > 0 && (
                <div className="space-y-2">
                  <p className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">
                    Move to Stage
                  </p>
                  <div className="flex flex-wrap gap-1.5">
                    {funnelStages.map((stage) => {
                      const isCurrentStage =
                        (stage.id === 'parsing' && candidate.status === 'pending') ||
                        (stage.id.startsWith('hr') && candidate.status === 'hr_approved') ||
                        (stage.id === 'selected' && candidate.status === 'selected') ||
                        (stage.id.startsWith('r') && candidate.status === 'scheduled' && candidate.current_round === parseInt(stage.id.replace('r', '')))
                      
                      return (
                        <span
                          key={stage.id}
                          className={cn(
                            'px-3 py-1.5 rounded-full text-[11px] font-bold border transition-all',
                            isCurrentStage
                              ? 'bg-foreground text-background border-transparent'
                              : 'bg-secondary/30 text-muted-foreground border-transparent'
                          )}
                        >
                          {stage.label}
                        </span>
                      )
                    })}
                  </div>
                </div>
              )}

              <div className="flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1 h-12 rounded-2xl border-rose-500/30 text-rose-500 hover:bg-rose-500/10 font-bold"
                  onClick={() => rejectMutation.mutate(candidate.id)}
                  disabled={rejectMutation.isPending || candidate.status === 'rejected' || candidate.status === 'selected'}
                >
                  Reject
                </Button>
                <Button
                  className="flex-[2] h-12 rounded-2xl bg-foreground text-background hover:bg-foreground/90 font-bold shadow-lg"
                  onClick={() => {
                    if (candidate.status === 'hr_approved') {
                      setSelectedTab('book')
                    } else {
                      approveMutation.mutate(candidate.id)
                    }
                  }}
                  disabled={approveMutation.isPending || candidate.status === 'selected' || candidate.status === 'rejected'}
                >
                  {candidate.status === 'hr_approved' ? (
                    <>
                      <Calendar className="h-4 w-4 mr-2" />
                      Schedule Round {candidate.current_round || 1} →
                    </>
                  ) : (
                    <>
                      <Check className="h-4 w-4 mr-2" />
                      Approve & Advance →
                    </>
                  )}
                </Button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}

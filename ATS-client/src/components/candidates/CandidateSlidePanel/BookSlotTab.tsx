import { useMutation, useQueryClient } from '@tanstack/react-query'
import { format, isAfter, isBefore, startOfDay } from 'date-fns'
import { useEffect, useMemo, useState } from 'react'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { interviewsApi, roundsApi } from '../../../api'
import { useFreeSlots } from '../../../hooks/useFreeSlots'
import type { Candidate, FreeSlot } from '../../../types'
import { SlotCalendar } from '../../booking/SlotCalendar'
import { SlotTimeline } from '../../booking/SlotTimeline'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'
import { useQuery } from '@tanstack/react-query'

const durations = [30, 45, 60, 120]

export function BookSlotTab({
  candidate,
  onBooked,
}: {
  candidate: Candidate
  onBooked?: () => void
}) {
  const queryClient = useQueryClient()
  const [candidateEmail, setCandidateEmail] = useState(candidate.candidateEmail)
  const [interviewerEmail, setInterviewerEmail] = useState(candidate.assignedInterviewerEmail ?? '')
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [date, setDate] = useState(startOfDay(new Date()))
  const [selected, setSelected] = useState<FreeSlot | null>(null)
  const { data: rounds = [] } = useQuery({
    queryKey: ['rounds', candidate.role],
    queryFn: () => roundsApi.listByRole(candidate.role),
    enabled: Boolean(candidate.role),
  })

  const derivedRound = useMemo(
    () => rounds.find((round) => round.roundNumber === (candidate.currentRound || 1)),
    [rounds, candidate.currentRound]
  )

  const effectiveInterviewerEmail = candidate.assignedInterviewerEmail || derivedRound?.interviewerGmail || interviewerEmail
  const query = useFreeSlots({ interviewerEmail: effectiveInterviewerEmail, date: format(date, 'yyyy-MM-dd'), durationMinutes })

  useEffect(() => {
    if (effectiveInterviewerEmail) setInterviewerEmail(effectiveInterviewerEmail)
  }, [effectiveInterviewerEmail])

  const filteredFree = useMemo(() => {
    const buffer = new Date(Date.now() + 30 * 60 * 1000)
    return (query.data?.free ?? []).filter((slot) => isAfter(new Date(slot.start), buffer))
  }, [query.data?.free])

  const bookMutation = useMutation({
    mutationFn: () =>
      interviewsApi.book({
        candidateId: candidate.id,
        candidateEmail,
        interviewerEmail: effectiveInterviewerEmail,
        date: format(date, 'yyyy-MM-dd'),
        startTime: format(new Date(selected!.start), 'HH:mm'),
        endTime: format(new Date(selected!.end), 'HH:mm'),
        roleName: candidate.role,
        roundNumber: candidate.currentRound || 1,
        durationMinutes,
      }),
    onSuccess: () => {
      toast.success('Interview booked successfully')
      queryClient.invalidateQueries({ queryKey: ['candidate-interviews', candidate.id] })
      queryClient.invalidateQueries({ queryKey: ['interviews'] })
      queryClient.invalidateQueries({ queryKey: ['my-interviews'] })
      queryClient.invalidateQueries({ queryKey: ['activity', candidate.id] })
      onBooked?.()
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to book interview')
    },
  })

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div><p className="mb-2 text-[11px] font-semibold text-muted-foreground">CANDIDATE EMAIL</p><Input value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} /></div>
        <div>
          <p className="mb-2 text-[11px] font-semibold text-muted-foreground">INTERVIEWER EMAIL</p>
          <Input value={effectiveInterviewerEmail} readOnly disabled />
          <p className="mt-1 text-xs text-muted-foreground">
            Auto-filled from {candidate.currentRound || 1}{candidate.currentRound === 1 ? 'st' : candidate.currentRound === 2 ? 'nd' : candidate.currentRound === 3 ? 'rd' : 'th'} round configuration.
          </p>
        </div>
        <div>
          <p className="mb-2 text-[11px] font-semibold text-muted-foreground">DURATION</p>
          <div className="flex flex-wrap gap-2">
            {durations.map((duration) => <Button key={duration} size="sm" variant={duration === durationMinutes ? 'default' : 'secondary'} onClick={() => setDurationMinutes(duration)}>{duration === 60 ? '1 hr' : duration === 120 ? '2 hr' : `${duration} min`}</Button>)}
          </div>
        </div>
        <SlotCalendar value={date} minDate={startOfDay(new Date())} onChange={setDate} />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-muted-foreground">AVAILABLE SLOTS</p>
          <p className="text-[11px] text-muted-foreground">{query.data?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        </div>
        {!effectiveInterviewerEmail ? (
          <p className="text-sm text-red-500">
            No interviewer is configured for round {candidate.currentRound || 1}. Please add that round in Settings first.
          </p>
        ) : null}
        {isBefore(date, startOfDay(new Date())) ? (
          <p className="text-sm text-muted-foreground">Past dates cannot be booked. Please choose today or a future day.</p>
        ) : null}
        {query.isFetching ? (
          <div className="flex flex-col items-center justify-center py-12 text-center rounded-2xl border border-dashed border-border bg-muted/50">
            <Loader2 className="h-8 w-8 animate-spin text-brand mb-3" />
            <p className="text-sm text-muted-foreground font-medium">Fetching available slots...</p>
            <p className="text-[10px] text-muted-foreground mt-1 uppercase tracking-widest">Checking calendar sync</p>
          </div>
        ) : (
          <SlotTimeline busy={query.data?.busy ?? []} free={filteredFree} selected={selected} onSelect={setSelected} durationMinutes={durationMinutes} />
        )}
        {selected ? (
          <div className="rounded-[12px] border-l-4 border-brand bg-brand/10 p-4">
            <p className="text-sm font-semibold">{format(new Date(selected.start), 'EEEE, MMM d')}</p>
            <p className="text-sm text-muted-foreground">{format(new Date(selected.start), 'hh:mm a')} – {format(new Date(selected.end), 'hh:mm a')}</p>
          </div>
        ) : null}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1" onClick={() => setSelected(null)}>Clear</Button>
          <Button className="flex-1" disabled={!selected || bookMutation.isPending || !effectiveInterviewerEmail} onClick={() => bookMutation.mutate()}>
            {bookMutation.isPending ? 'Booking...' : 'Confirm Booking'}
          </Button>
        </div>
      </div>
    </div>
  )
}

import { format, isAfter } from 'date-fns'
import { useMemo, useState } from 'react'
import { useFreeSlots } from '../../../hooks/useFreeSlots'
import type { Candidate, FreeSlot } from '../../../types'
import { SlotCalendar } from '../../booking/SlotCalendar'
import { SlotTimeline } from '../../booking/SlotTimeline'
import { Button } from '../../ui/button'
import { Input } from '../../ui/input'

const durations = [30, 45, 60, 120]

export function BookSlotTab({ candidate }: { candidate: Candidate }) {
  const [candidateEmail, setCandidateEmail] = useState(candidate.candidateEmail)
  const [interviewerEmail, setInterviewerEmail] = useState(candidate.assignedInterviewerEmail ?? '')
  const [durationMinutes, setDurationMinutes] = useState(45)
  const [date, setDate] = useState(new Date())
  const [selected, setSelected] = useState<FreeSlot | null>(null)
  const query = useFreeSlots({ interviewerEmail, date: format(date, 'yyyy-MM-dd'), durationMinutes })

  const filteredFree = useMemo(() => {
    const buffer = new Date(Date.now() + 30 * 60 * 1000)
    return (query.data?.free ?? []).filter((slot) => isAfter(new Date(slot.start), buffer))
  }, [query.data?.free])

  return (
    <div className="grid gap-8 lg:grid-cols-2">
      <div className="space-y-4">
        <div><p className="mb-2 text-[11px] font-semibold text-[var(--text-2)]">CANDIDATE EMAIL</p><Input value={candidateEmail} onChange={(e) => setCandidateEmail(e.target.value)} /></div>
        <div><p className="mb-2 text-[11px] font-semibold text-[var(--text-2)]">INTERVIEWER EMAIL</p><Input value={interviewerEmail} onChange={(e) => setInterviewerEmail(e.target.value)} /></div>
        <div>
          <p className="mb-2 text-[11px] font-semibold text-[var(--text-2)]">DURATION</p>
          <div className="flex flex-wrap gap-2">
            {durations.map((duration) => <Button key={duration} size="sm" variant={duration === durationMinutes ? 'default' : 'secondary'} onClick={() => setDurationMinutes(duration)}>{duration === 60 ? '1 hr' : duration === 120 ? '2 hr' : `${duration} min`}</Button>)}
          </div>
        </div>
        <SlotCalendar value={date} onChange={setDate} />
      </div>
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <p className="text-[11px] font-semibold text-[var(--text-2)]">AVAILABLE SLOTS</p>
          <p className="text-[11px] text-[var(--text-2)]">{query.data?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone}</p>
        </div>
        <SlotTimeline busy={query.data?.busy ?? []} free={filteredFree} selected={selected} onSelect={setSelected} durationMinutes={durationMinutes} />
        {selected ? (
          <div className="rounded-[12px] border-l-4 border-[var(--brand)] bg-[var(--brand-light)] p-4">
            <p className="text-sm font-semibold">{format(new Date(selected.start), 'EEEE, MMM d')}</p>
            <p className="text-sm text-[var(--text-2)]">{format(new Date(selected.start), 'hh:mm a')} – {format(new Date(selected.end), 'hh:mm a')}</p>
          </div>
        ) : null}
        <div className="flex gap-3">
          <Button variant="secondary" className="flex-1">Reschedule</Button>
          <Button className="flex-1" disabled={!selected}>Confirm Booking</Button>
        </div>
      </div>
    </div>
  )
}

import { format } from 'date-fns'
import type { BusyBlock, FreeSlot } from '../../types'
import { Button } from '../ui/button'

function range(start: string, end: string) {
  return `${format(new Date(start), 'hh:mm a')} – ${format(new Date(end), 'hh:mm a')}`
}

export function SlotTimeline({
  busy,
  free,
  selected,
  onSelect,
  durationMinutes,
}: {
  busy: BusyBlock[]
  free: FreeSlot[]
  selected?: FreeSlot | null
  onSelect: (slot: FreeSlot) => void
  durationMinutes: number
}) {
  return (
    <div className="space-y-3">
      {busy.map((block) => (
        <div key={block.start} className="rounded-[10px] border-l-[3px] border-[var(--error)] bg-[var(--error-light)] p-3">
          <p className="text-sm font-medium">{range(block.start, block.end)}</p>
          <p className="text-xs text-[var(--text-2)]">{block.title}</p>
        </div>
      ))}
      {free.map((slot) => (
        <div key={slot.start} className="rounded-[10px] border-l-[3px] border-[var(--success)] bg-[var(--success-light)] p-3">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">{range(slot.start, slot.end)}</p>
            <span className="text-[11px] text-[var(--success)]">FREE</span>
          </div>
          <Button variant={selected?.start === slot.start ? 'default' : 'secondary'} size="sm" onClick={() => onSelect(slot)}>
            {range(slot.start, slot.end)}
          </Button>
        </div>
      ))}
      {!busy.length && !free.length ? <p className="text-sm text-[var(--text-2)]">No available {durationMinutes} minute slots for this day.</p> : null}
    </div>
  )
}

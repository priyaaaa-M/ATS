import { format } from 'date-fns'
import type { BusyBlock, FreeSlot } from '../../types'
import { cn } from '../../lib/utils'

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
        <div key={block.start} className="rounded-xl border-l-[3px] border-red-500 bg-red-500/10 p-3">
          <p className="text-sm font-bold text-red-500">{range(block.start, block.end)}</p>
          <p className="text-xs text-red-400/80 mt-0.5">{block.title}</p>
        </div>
      ))}
      {free.map((slot) => (
        <div 
          key={slot.start} 
          onClick={() => onSelect(slot)}
          className={cn(
            "rounded-xl border-l-[3px] p-3 cursor-pointer transition-all",
            selected?.start === slot.start 
              ? "border-emerald-500 bg-emerald-500/20 ring-1 ring-emerald-500/30 shadow-lg shadow-emerald-500/10" 
              : "border-emerald-500 bg-emerald-500/10 hover:bg-emerald-500/15"
          )}
        >
          <div className="flex items-center justify-between">
            <p className="text-sm font-bold text-emerald-500">{range(slot.start, slot.end)}</p>
            <span className={cn(
              "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-widest",
              selected?.start === slot.start ? "bg-emerald-500 text-white" : "bg-emerald-500/20 text-emerald-500"
            )}>
              {selected?.start === slot.start ? 'Selected' : 'Available'}
            </span>
          </div>
          <p className="mt-1 text-[11px] text-emerald-400/80">Click to select this time slot</p>
        </div>
      ))}
      {!busy.length && !free.length ? <p className="text-sm text-muted-foreground italic">No available {durationMinutes} minute slots for this day.</p> : null}
    </div>
  )
}

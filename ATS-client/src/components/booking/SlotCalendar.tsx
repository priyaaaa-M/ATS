import { addDays, endOfMonth, endOfWeek, format, isBefore, isSameDay, isSameMonth, isToday, startOfMonth, startOfWeek } from 'date-fns'
import { ChevronLeft, ChevronRight } from 'lucide-react'
import { useMemo, useState } from 'react'
import { cn } from '../../lib/utils'

export function SlotCalendar({
  value,
  minDate,
  onChange,
}: {
  value?: Date
  minDate?: Date
  onChange: (date: Date) => void
}) {
  const [month, setMonth] = useState(value ?? new Date())
  const days = useMemo(() => {
    const start = startOfWeek(startOfMonth(month))
    const end = endOfWeek(endOfMonth(month))
    const dates: Date[] = []
    let current = start
    while (current <= end) {
      dates.push(current)
      current = addDays(current, 1)
    }
    return dates
  }, [month])

  return (
    <div>
      <div className="mb-4 flex items-center justify-between">
        <button onClick={() => setMonth(addDays(startOfMonth(month), -1))}><ChevronLeft className="h-4 w-4" /></button>
        <p className="text-sm font-semibold">{format(month, 'MMMM yyyy')}</p>
        <button onClick={() => setMonth(addDays(endOfMonth(month), 1))}><ChevronRight className="h-4 w-4" /></button>
      </div>
      <div className="grid grid-cols-7 gap-2 text-center text-xs text-muted-foreground">
        {['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'].map((day) => <span key={day}>{day}</span>)}
        {days.map((date) => {
          const minimum = minDate ?? new Date()
          const disabled = isBefore(date, minimum) && !isSameDay(date, minimum) && !isToday(date)
          return (
            <button
              key={date.toISOString()}
              disabled={disabled}
              onClick={() => onChange(date)}
              className={cn(
                'flex h-9 items-center justify-center rounded-full text-sm',
                isSameDay(value ?? new Date(0), date) && 'bg-brand text-white',
                !isSameDay(value ?? new Date(0), date) && isToday(date) && 'font-semibold text-brand',
                !isSameMonth(date, month) && 'text-muted-foreground/40',
                disabled && 'cursor-not-allowed text-muted-foreground/40',
              )}
            >
              {format(date, 'd')}
            </button>
          )
        })}
      </div>
    </div>
  )
}

import * as React from 'react'
import { cn } from '../../lib/utils'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn('min-h-[96px] w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-1)] outline-none transition placeholder:text-[var(--text-3)] focus:border-[var(--brand)]', className)}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

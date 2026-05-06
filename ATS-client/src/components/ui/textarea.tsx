import * as React from 'react'
import { cn } from '../../lib/utils'

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn('min-h-[96px] w-full rounded-[9px] border border-[#d0d5dd] bg-white px-3 py-2 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#667085]', className)}
    {...props}
  />
))
Textarea.displayName = 'Textarea'

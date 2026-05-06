import * as React from 'react'
import { cn } from '../../lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn('flex h-10 w-full rounded-[10px] border border-[var(--border)] bg-[var(--bg-card)] px-3 py-2 text-sm text-[var(--text-1)] outline-none transition placeholder:text-[var(--text-3)] focus:border-[var(--brand)]', className)}
    {...props}
  />
))
Input.displayName = 'Input'

import * as React from 'react'
import { cn } from '../../lib/utils'

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn('flex h-10 w-full rounded-[9px] border border-[#d0d5dd] bg-white px-3 py-2 text-sm text-[#101828] outline-none transition placeholder:text-[#98a2b3] focus:border-[#667085]', className)}
    {...props}
  />
))
Input.displayName = 'Input'

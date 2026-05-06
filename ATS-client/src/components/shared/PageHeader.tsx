import type { ReactNode } from 'react'

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="rounded-[12px] border border-[#e5e7eb] bg-white px-4 py-3.5 shadow-[0_1px_2px_rgba(16,24,40,0.035)]">
      <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-[18px] font-semibold tracking-[-0.025em] text-[#0b1220]">{title}</h1>
        {description ? <p className="mt-0.5 text-[12px] leading-5 text-[#667085]">{description}</p> : null}
      </div>
      {actions}
      </div>
    </div>
  )
}

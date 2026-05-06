import { ReactNode } from 'react'

export function PageHeader({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) {
  return (
    <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
      <div>
        <h1 className="text-[17px] font-semibold text-[var(--text-1)]">{title}</h1>
        {description ? <p className="mt-1 text-sm text-[var(--text-2)]">{description}</p> : null}
      </div>
      {actions}
    </div>
  )
}

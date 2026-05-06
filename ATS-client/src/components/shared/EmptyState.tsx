import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex min-h-[180px] flex-col items-center justify-center rounded-[14px] border border-dashed bg-[var(--bg-card)] px-6 text-center">
      <Icon className="mb-3 h-8 w-8 text-[var(--text-3)]" />
      <p className="text-sm font-semibold text-[var(--text-1)]">{title}</p>
      <p className="mt-1 max-w-sm text-sm text-[var(--text-2)]">{description}</p>
    </div>
  )
}

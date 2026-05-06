import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, title, description }: { icon: LucideIcon; title: string; description: string }) {
  return (
    <div className="flex min-h-[240px] flex-col items-center justify-center rounded-[14px] border border-[#e5e7eb] bg-white px-6 text-center shadow-[0_8px_24px_rgba(16,24,40,0.035)]">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-[11px] border border-[#e5e7eb] bg-[#f8fafc] text-[#667085]">
        <Icon className="h-5 w-5" />
      </div>
      <p className="text-[15px] font-semibold text-[#0b1220]">{title}</p>
      <p className="mt-1.5 max-w-sm text-[13px] leading-5 text-[#667085]">{description}</p>
    </div>
  )
}

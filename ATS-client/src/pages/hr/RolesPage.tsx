import { useMemo } from 'react'
import { Briefcase, Plus } from 'lucide-react'
import { useRoles } from '../../hooks/useRoles'
import { PageHeader } from '../../components/shared/PageHeader'
import { EmptyState } from '../../components/shared/EmptyState'
import { Button } from '../../components/ui/button'
import { RoleCard } from '../../components/roles/RoleCard'

export function RolesPage() {
  const { data: roles = [] } = useRoles()
  const filters = ['all', 'open', 'draft', 'paused'] as const
  const active = 'all'
  const visible = useMemo(() => roles.filter((role) => active === 'all' || role.status === active), [active, roles])

  return (
    <div className="space-y-6">
      <PageHeader
        title="Open Roles"
        description={`${roles.length} role${roles.length === 1 ? '' : 's'} in your hiring workspace.`}
        actions={<Button className="h-9 rounded-[8px] bg-[#ec5b24] px-3.5 text-[13px] font-semibold hover:bg-[#dd4f1b]"><Plus className="h-4 w-4" /> New Role</Button>}
      />
      <div className="inline-flex w-fit rounded-[9px] border border-[#e5e7eb] bg-white p-1 shadow-[0_1px_2px_rgba(16,24,40,0.035)]">
        {filters.map((filter) => (
          <button
            key={filter}
            className={`h-8 rounded-[7px] px-3 text-[12px] font-semibold transition ${active === filter ? 'bg-[#0f172a] text-white shadow-[0_1px_2px_rgba(16,24,40,0.14)]' : 'text-[#667085] hover:bg-[#f8fafc] hover:text-[#101828]'}`}
          >
            {filter[0].toUpperCase() + filter.slice(1)} <span className={active === filter ? 'text-white/70' : 'text-[#98a2b3]'}>({roles.filter((role) => filter === 'all' || role.status === filter).length})</span>
          </button>
        ))}
      </div>
      <div className="grid max-w-[920px] gap-4 lg:grid-cols-2">
        {visible.length ? visible.map((role) => <RoleCard key={role.id} role={role} onClick={() => undefined} />) : <div className="col-span-full"><EmptyState icon={Briefcase} title="No roles available" description="Synced roles and manually created roles will appear here." /></div>}
      </div>
    </div>
  )
}

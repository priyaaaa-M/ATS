import { useMemo } from 'react'
import { useRoles } from '../../hooks/useRoles'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/button'
import { RoleCard } from '../../components/roles/RoleCard'

export function RolesPage() {
  const { data: roles = [] } = useRoles()
  const filters = ['all', 'open', 'draft', 'paused'] as const
  const active = 'all'
  const visible = useMemo(() => roles.filter((role) => active === 'all' || role.status === active), [active, roles])

  return (
    <div className="space-y-6">
      <PageHeader title={`Open Roles`} description={`${roles.length} roles`} actions={<Button>+ New Role</Button>} />
      <div className="flex gap-2">
        {filters.map((filter) => <button key={filter} className={`rounded-full px-4 py-2 text-sm ${active === filter ? 'bg-[var(--brand)] text-white' : 'border bg-[var(--bg-card)]'}`}>{filter[0].toUpperCase() + filter.slice(1)} ({roles.filter((role) => filter === 'all' || role.status === filter).length})</button>)}
      </div>
      <div className="grid gap-4 lg:grid-cols-2">
        {visible.length ? visible.map((role) => <RoleCard key={role.id} role={role} onClick={() => undefined} />) : <div className="col-span-full"><p className="rounded-[14px] border bg-[var(--bg-card)] p-8 text-sm text-[var(--text-2)]">No roles available.</p></div>}
      </div>
    </div>
  )
}

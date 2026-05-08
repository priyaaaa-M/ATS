import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { useRoles } from '../../hooks/useRoles'
import { rolesApi } from '../../api'
import { RoleCard } from '../../components/roles/RoleCard'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import type { Role } from '../../types'

export function RolesPage() {
  const queryClient = useQueryClient()
  const { data: roles = [] } = useRoles()
  const [activeFilter, setActiveFilter] = useState<'all' | 'open' | 'draft' | 'paused'>('all')
  const [activeRole, setActiveRole] = useState<Role | null>(null)
  const [criteria, setCriteria] = useState<
    Array<{ id?: string; question: string; type?: 'yes_no' | 'scale'; required?: boolean }>
  >([])

  useEffect(() => {
    setCriteria(activeRole?.screeningQuestions || [])
  }, [activeRole])

  const filters = ['all', 'open', 'draft', 'paused'] as const
  const visible = useMemo(
    () =>
      roles.filter(
        (role) => activeFilter === 'all' || (role.status ?? 'open') === activeFilter
      ),
    [activeFilter, roles]
  )

  const saveCriteriaMutation = useMutation({
    mutationFn: () =>
      rolesApi.updateScreeningQuestions(
        activeRole!.name,
        criteria.filter((criterion) => criterion.question.trim())
      ),
    onSuccess: async () => {
      toast.success('Screening criteria updated')
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      if (activeRole) {
        await queryClient.invalidateQueries({
          queryKey: ['screening-questions', activeRole.name],
        })
      }
      setActiveRole(null)
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not save screening criteria')
    },
  })

  return (
    <div className="space-y-6">
      <PageHeader
        title="Open Roles"
        description={`${roles.length} roles`}
        actions={<Button>+ New Role</Button>}
      />
      <div className="flex flex-wrap gap-2">
        {filters.map((filter) => (
          <button
            key={filter}
            onClick={() => setActiveFilter(filter)}
            className={`rounded-full px-4 py-2 text-sm transition-all ${
              activeFilter === filter
                ? 'bg-[var(--brand)] text-white shadow-[0_8px_24px_rgba(0,0,0,0.16)]'
                : 'border bg-[var(--bg-card)] text-[var(--text-2)] hover:border-primary/40 hover:text-foreground'
            }`}
          >
            {filter[0].toUpperCase() + filter.slice(1)} (
            {roles.filter((role) => filter === 'all' || (role.status ?? 'open') === filter).length}
            )
          </button>
        ))}
      </div>
      <div className="grid gap-5 xl:grid-cols-2">
        {visible.length ? (
          visible.map((role) => (
            <RoleCard key={role.id} role={role} onClick={() => setActiveRole(role)} />
          ))
        ) : (
          <div className="col-span-full">
            <p className="rounded-[14px] border bg-[var(--bg-card)] p-8 text-sm text-[var(--text-2)]">
              No roles available.
            </p>
          </div>
        )}
      </div>

      <Dialog open={Boolean(activeRole)} onOpenChange={(open) => !open && setActiveRole(null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{activeRole?.title || activeRole?.name}</DialogTitle>
            <DialogDescription>
              Add screening criteria so recruiters can use scorecards for this role.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-semibold">Screening Criteria</h3>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setCriteria((current) => [...current, { question: '', type: 'yes_no', required: false }])
                }
              >
                + Add Criterion
              </Button>
            </div>

            {criteria.map((criterion, index) => (
              <div
                key={criterion.id || index}
                className="flex items-center gap-3 rounded-lg border border-border bg-muted/30 p-3"
              >
                <Input
                  placeholder="e.g. 5+ years experience in role"
                  value={criterion.question}
                  onChange={(event) =>
                    setCriteria((current) =>
                      current.map((item, itemIndex) =>
                        itemIndex === index ? { ...item, question: event.target.value } : item
                      )
                    )
                  }
                  className="flex-1"
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() =>
                    setCriteria((current) => current.filter((_, itemIndex) => itemIndex !== index))
                  }
                  className="text-destructive hover:text-destructive"
                >
                  Remove
                </Button>
              </div>
            ))}

            {criteria.length === 0 && (
              <p className="py-4 text-center text-sm text-muted-foreground">
                No screening criteria yet. Add criteria to enable scorecards for this role.
              </p>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setActiveRole(null)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveCriteriaMutation.mutate()}
              disabled={saveCriteriaMutation.isPending}
            >
              Save Criteria
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  )
}

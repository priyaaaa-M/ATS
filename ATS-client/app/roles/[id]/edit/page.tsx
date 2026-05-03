'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useParams, useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { RoleForm } from '@/components/roles/role-form'
import { rolesApi } from '@/lib/api'
import { toast } from 'sonner'
import { Skeleton } from '@/components/ui/skeleton'

export default function EditRolePage() {
  const params = useParams()
  const router = useRouter()
  const queryClient = useQueryClient()
  const roleId = params.id as string

  const { data: role, isLoading } = useQuery({
    queryKey: ['role-details', roleId],
    queryFn: () => rolesApi.getById(roleId),
    enabled: Boolean(roleId),
  })

  const updateMutation = useMutation({
    mutationFn: (payload: any) => rolesApi.update(roleId, payload),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['role-details'] })
      toast.success('Role updated')
      router.push(`/roles/${roleId}`)
    },
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-[Syne] text-2xl font-bold text-foreground">Edit Role</h1>
          <p className="text-muted-foreground">Update role details and pipeline</p>
        </div>

        {isLoading ? (
          <Skeleton className="h-[540px] bg-surface-2" />
        ) : (
          <RoleForm
            role={role}
            onSave={(payload) => updateMutation.mutate(payload)}
            isSaving={updateMutation.isPending}
            saveLabel="Save Changes"
          />
        )}
      </div>
    </AppShell>
  )
}

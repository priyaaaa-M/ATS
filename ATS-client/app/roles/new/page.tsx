'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { useRouter } from 'next/navigation'
import { AppShell } from '@/components/layout/app-shell'
import { RoleForm } from '@/components/roles/role-form'
import { rolesApi } from '@/lib/api'
import { toast } from 'sonner'

export default function NewRolePage() {
  const router = useRouter()
  const queryClient = useQueryClient()
  const createMutation = useMutation({
    mutationFn: rolesApi.create,
    onSuccess: (role) => {
      queryClient.invalidateQueries({ queryKey: ['role-details'] })
      toast.success('Role created')
      router.push(`/roles/${role.id}`)
    },
  })

  return (
    <AppShell>
      <div className="space-y-6">
        <div>
          <h1 className="font-[Syne] text-2xl font-bold text-foreground">Create Role</h1>
          <p className="text-muted-foreground">Set up a new hiring role and pipeline</p>
        </div>
        <RoleForm
          onSave={(payload) => createMutation.mutate(payload)}
          isSaving={createMutation.isPending}
          saveLabel="Publish Role"
        />
      </div>
    </AppShell>
  )
}

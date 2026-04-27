'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { roundsApi, rolesApi } from '@/lib/api'

export function RoundsPanel() {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState('')
  const [form, setForm] = useState({ interviewerName: '', interviewerGmail: '' })

  const { data: roles = [], isLoading: isRolesLoading } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
  })

  const { data: rounds = [], isLoading: isRoundsLoading } = useQuery({
    queryKey: ['rounds', selectedRole],
    queryFn: () => roundsApi.listByRole(selectedRole),
    enabled: Boolean(selectedRole),
  })

  const addRound = useMutation({
    mutationFn: roundsApi.create,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] })
      toast.success('Round added')
      setForm({ interviewerName: '', interviewerGmail: '' })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to add round')
    },
  })

  const deleteRound = useMutation({
    mutationFn: roundsApi.delete,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['rounds'] })
      toast.success('Round deleted')
    },
  })

  const selectedRoleLabel = useMemo(
    () => roles.find((role) => role.name === selectedRole)?.name,
    [roles, selectedRole]
  )

  if (isRolesLoading) {
    return <Skeleton className="h-[360px] w-full bg-surface-2" />
  }

  return (
    <div className="space-y-6">
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="font-[Syne]">Interview Rounds</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="space-y-2">
            <Label>Select Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger>
                <SelectValue placeholder="Choose a role" />
              </SelectTrigger>
              <SelectContent>
                {roles.map((role) => (
                  <SelectItem key={role.id} value={role.name}>
                    {role.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedRole ? (
            <>
              <div className="grid gap-3 md:grid-cols-2">
                <div className="space-y-2">
                  <Label>Interviewer Name</Label>
                  <Input
                    value={form.interviewerName}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, interviewerName: event.target.value }))
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Interviewer Gmail</Label>
                  <Input
                    value={form.interviewerGmail}
                    onChange={(event) =>
                      setForm((current) => ({ ...current, interviewerGmail: event.target.value }))
                    }
                  />
                </div>
              </div>
              <Button
                onClick={() =>
                  addRound.mutate({
                    roleName: selectedRole,
                    roundNumber: rounds.length + 1,
                    interviewerName: form.interviewerName,
                    interviewerGmail: form.interviewerGmail,
                  })
                }
                disabled={
                  addRound.isPending || !form.interviewerName || !form.interviewerGmail
                }
              >
                <Plus className="mr-2 h-4 w-4" />
                Add Round
              </Button>
            </>
          ) : null}

          {isRoundsLoading ? (
            <Skeleton className="h-32 w-full bg-surface-2" />
          ) : (
            <div className="space-y-3">
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="flex items-center justify-between rounded-xl border border-border bg-surface-2 p-4"
                >
                  <div>
                    <p className="font-medium">Round {round.round_number}</p>
                    <p className="text-sm text-muted-foreground">
                      {round.interviewer_name} • {round.interviewer_gmail}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => deleteRound.mutate(round.id)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
              {selectedRole && rounds.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No rounds configured yet for {selectedRoleLabel}.
                </p>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

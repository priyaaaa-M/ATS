'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Copy, Link2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { inviteApi, roundsApi, rolesApi } from '@/lib/api'

export function InvitePanel() {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedRound, setSelectedRound] = useState('')
  const [email, setEmail] = useState('')
  const [generatedLink, setGeneratedLink] = useState('')

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: rolesApi.list,
  })

  const { data: rounds = [] } = useQuery({
    queryKey: ['invite-rounds', selectedRole],
    queryFn: () => roundsApi.listByRole(selectedRole),
    enabled: Boolean(selectedRole),
  })

  const { data: invites = [] } = useQuery({
    queryKey: ['invites'],
    queryFn: inviteApi.list,
  })

  const selectedRoundData = useMemo(
    () => rounds.find((round) => String(round.round_number) === selectedRound),
    [rounds, selectedRound]
  )

  const generateInvite = useMutation({
    mutationFn: inviteApi.generate,
    onSuccess: (data) => {
      setGeneratedLink(data.inviteLink)
      queryClient.invalidateQueries({ queryKey: ['invites'] })
      toast.success('Invite link generated')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to generate invite')
    },
  })

  return (
    <div className="space-y-6">
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="font-[Syne]">Invite Interviewers</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={selectedRole}
                onValueChange={(value) => {
                  setSelectedRole(value)
                  setSelectedRound('')
                  setEmail('')
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select role" />
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
            <div className="space-y-2">
              <Label>Round</Label>
              <Select
                value={selectedRound}
                onValueChange={(value) => {
                  setSelectedRound(value)
                  const match = rounds.find((round) => String(round.round_number) === value)
                  setEmail(match?.interviewer_gmail || '')
                }}
                disabled={!selectedRole}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select round" />
                </SelectTrigger>
                <SelectContent>
                  {rounds.map((round) => (
                    <SelectItem key={round.id} value={String(round.round_number)}>
                      Round {round.round_number}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Email</Label>
              <Input value={email} onChange={(event) => setEmail(event.target.value)} />
            </div>
          </div>

          <Button
            onClick={() =>
              generateInvite.mutate({
                email,
                roleName: selectedRole,
                roundNumber: Number(selectedRound),
              })
            }
            disabled={generateInvite.isPending || !selectedRole || !selectedRound || !email}
          >
            <Link2 className="mr-2 h-4 w-4" />
            Generate Link
          </Button>

          {generatedLink ? (
            <div className="rounded-xl border border-border bg-surface-2 p-3">
              <Label>Generated Link</Label>
              <div className="mt-2 flex gap-2">
                <Input readOnly value={generatedLink} />
                <Button
                  variant="outline"
                  onClick={async () => {
                    await navigator.clipboard.writeText(generatedLink)
                    toast.success('Copied')
                  }}
                >
                  <Copy className="h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : null}
        </CardContent>
      </Card>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="font-[Syne]">Sent Invites</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {invites.map((invite) => (
            <div key={invite.id} className="rounded-xl border border-border bg-surface-2 p-4">
              <p className="font-medium">{invite.email}</p>
              <p className="text-sm text-muted-foreground">
                {invite.role_name} • Round {invite.round_number}
              </p>
              <p className="text-xs text-muted-foreground">
                {invite.used ? 'Used' : 'Pending'} • Expires {new Date(invite.expires_at).toLocaleString()}
              </p>
            </div>
          ))}
          {invites.length === 0 ? (
            <p className="text-sm text-muted-foreground">No invites sent yet.</p>
          ) : null}
        </CardContent>
      </Card>
    </div>
  )
}

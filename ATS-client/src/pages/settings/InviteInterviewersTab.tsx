import { useEffect, useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { formatDistanceToNow } from 'date-fns'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { inviteApi, rolesApi, roundsApi } from '../../api'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '../../components/ui/table'

export function InviteInterviewersTab() {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState('')
  const [selectedRoundId, setSelectedRoundId] = useState('')
  const [cooldown, setCooldown] = useState(false)
  const [sentSuccess, setSentSuccess] = useState(false)

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
  })

  const syncRolesMutation = useMutation({
    mutationFn: () => rolesApi.syncFromDrive(),
    onSuccess: async () => {
      toast.success('Roles synced from Drive')
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      await queryClient.invalidateQueries({ queryKey: ['rounds'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to sync roles')
    },
  })

  const { data: rounds = [] } = useQuery({
    queryKey: ['rounds', selectedRole],
    queryFn: () => roundsApi.listByRole(selectedRole),
    enabled: !!selectedRole,
  })

  const {
    data: invites = [],
    isLoading: isLoadingInvites,
    refetch: refetchInvites,
  } = useQuery({
    queryKey: ['invites'],
    queryFn: () => inviteApi.list(),
  })

  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0].name)
    }
  }, [roles, selectedRole])

  useEffect(() => {
    setSelectedRoundId('')
  }, [selectedRole])

  const selectedRound = useMemo(
    () => rounds.find((round) => round.id === selectedRoundId),
    [rounds, selectedRoundId]
  )

  const sendMutation = useMutation({
    mutationFn: () =>
      inviteApi.generate({
        email: selectedRound!.interviewerGmail,
        roleName: selectedRole,
        roundNumber: selectedRound!.roundNumber,
      }),
    onSuccess: () => {
      setCooldown(true)
      setSentSuccess(true)
      void queryClient.invalidateQueries({ queryKey: ['invites'] })
      window.setTimeout(() => {
        setCooldown(false)
        setSentSuccess(false)
      }, 5000)
      toast.success('Invitation sent')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to send invite')
    },
  })

  return (
    <div className="grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Send Interview Invitation</CardTitle>
          <CardDescription>
            Select a role and round. The invite email is sent directly to the
            interviewer&apos;s Gmail on file.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex flex-wrap items-end gap-3">
            <div className="flex-1 min-w-[220px]">
            <Label>Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="mt-1">
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
            <Button
              variant="outline"
              onClick={() => syncRolesMutation.mutate()}
              disabled={syncRolesMutation.isPending}
            >
              {syncRolesMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Syncing Roles...
                </>
              ) : (
                'Sync Roles'
              )}
            </Button>
          </div>

          <div>
            <Label>Round</Label>
            <Select value={selectedRoundId} onValueChange={setSelectedRoundId}>
              <SelectTrigger className="mt-1">
                <SelectValue placeholder="Select round" />
              </SelectTrigger>
              <SelectContent>
                {rounds.map((round) => (
                  <SelectItem key={round.id} value={round.id}>
                    Round {round.roundNumber}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {roles.length === 0 && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-4 text-sm text-[var(--text-2)]">
              No roles found yet. Sync roles from your Drive
              <code className="mx-1">rules/</code>
              folders first.
            </div>
          )}

          {selectedRound && (
            <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-4">
              <p className="text-xs font-semibold text-[var(--text-2)] uppercase tracking-wide mb-3">
                Invite will be sent to
              </p>
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--brand)] flex items-center justify-center text-sm font-bold text-white">
                  {selectedRound.interviewerName.slice(0, 2).toUpperCase()}
                </div>
                <div className="flex-1">
                  <p className="text-sm font-semibold">
                    {selectedRound.interviewerName}
                  </p>
                  <p className="text-xs text-[var(--text-2)] font-mono">
                    {selectedRound.interviewerGmail}
                  </p>
                </div>
                <Badge variant="outline">Round {selectedRound.roundNumber}</Badge>
              </div>
            </div>
          )}

          <div className="rounded-lg bg-amber-500/10 border border-amber-500/30 p-3 flex gap-3">
            <span>⏱</span>
            <div>
              <p className="text-sm font-medium text-amber-400">
                Invite link expires in 7 days
              </p>
              <p className="text-xs text-amber-400/70">
                The interviewer must log in with Google before it expires.
              </p>
            </div>
          </div>

          <Button
            className="w-full"
            onClick={() => sendMutation.mutate()}
            disabled={!selectedRound || sendMutation.isPending || cooldown}
          >
            {sendMutation.isPending ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Sending...
              </>
            ) : cooldown ? (
              '✓ Sent'
            ) : (
              'Send Invitation →'
            )}
          </Button>

          {sentSuccess && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/30 p-4 text-center">
              <p className="text-2xl mb-1">✅</p>
              <p className="text-sm font-semibold text-green-400">
                Invitation sent!
              </p>
              <p className="text-xs text-green-400/70 mt-1">
                {selectedRound?.interviewerGmail} will receive the invite link
                shortly.
              </p>
            </div>
          )}
        </CardContent>
      </Card>

      <Card className="mt-6">
        <CardHeader>
          <CardTitle>Sent Invitations</CardTitle>
          <CardDescription>
            Track pending, accepted, and expired interviewer invites.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoadingInvites ? (
            <div className="flex items-center gap-2 py-8 text-sm text-[var(--text-2)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading invites...
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Interviewer</TableHead>
                  <TableHead>Role · Round</TableHead>
                  <TableHead>Sent</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invites.map((invite) => {
                  const isExpired = new Date(invite.expiresAt) < new Date()
                  return (
                    <TableRow key={invite.id}>
                      <TableCell>
                        <p className="text-sm font-medium">{invite.email}</p>
                      </TableCell>
                      <TableCell className="text-[var(--text-2)] text-sm">
                        {invite.roleName} · R{invite.roundNumber}
                      </TableCell>
                      <TableCell className="text-[var(--text-2)] text-sm">
                        {formatDistanceToNow(new Date(invite.createdAt))} ago
                      </TableCell>
                      <TableCell>
                        <Badge
                          variant={
                            invite.used
                              ? 'default'
                              : isExpired
                                ? 'secondary'
                                : 'outline'
                          }
                        >
                          {invite.used ? '✓ Accepted' : isExpired ? 'Expired' : 'Pending'}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

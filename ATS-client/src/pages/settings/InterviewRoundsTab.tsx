import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { rolesApi, roundsApi } from '../../api'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../../components/ui/dialog'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import type { InterviewRound } from '../../types'

export function InterviewRoundsTab() {
  const queryClient = useQueryClient()
  const [selectedRole, setSelectedRole] = useState('')
  const [modalOpen, setModalOpen] = useState(false)
  const [editingRound, setEditingRound] = useState<InterviewRound | null>(null)
  const [modalForm, setModalForm] = useState({
    roundNumber: 1,
    interviewerName: '',
    interviewerGmail: '',
    duration: '45 min',
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
  })

  const syncRolesMutation = useMutation({
    mutationFn: () => rolesApi.syncFromDrive(),
    onSuccess: async () => {
      toast.success('Roles synced from Drive')
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Failed to sync roles')
    },
  })

  const {
    data: rounds = [],
    isLoading: isLoadingRounds,
    refetch: refetchRounds,
  } = useQuery({
    queryKey: ['rounds', selectedRole],
    queryFn: () => roundsApi.listByRole(selectedRole),
    enabled: !!selectedRole,
  })

  useEffect(() => {
    if (roles.length > 0 && !selectedRole) {
      setSelectedRole(roles[0].name)
    }
  }, [roles, selectedRole])

  function openAddModal() {
    setEditingRound(null)
    setModalForm({
      roundNumber: rounds.length + 1,
      interviewerName: '',
      interviewerGmail: '',
      duration: '45 min',
    })
    setModalOpen(true)
  }

  function openEditModal(round: InterviewRound) {
    setEditingRound(round)
    setModalForm({
      roundNumber: round.roundNumber,
      interviewerName: round.interviewerName,
      interviewerGmail: round.interviewerGmail,
      duration: round.duration || '',
    })
    setModalOpen(true)
  }

  const saveMutation = useMutation({
    mutationFn: async () => {
      if (editingRound) {
        return roundsApi.update(editingRound.id, {
          interviewerName: modalForm.interviewerName,
          interviewerGmail: modalForm.interviewerGmail,
          duration: modalForm.duration,
        })
      }
      return roundsApi.create({
        roleName: selectedRole,
        roundNumber: modalForm.roundNumber,
        interviewerName: modalForm.interviewerName,
        interviewerGmail: modalForm.interviewerGmail,
        duration: modalForm.duration,
      })
    },
    onSuccess: () => {
      toast.success(editingRound ? 'Round updated' : 'Round added')
      setModalOpen(false)
      void queryClient.invalidateQueries({ queryKey: ['rounds'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Save failed')
    },
  })

  const deleteMutation = useMutation({
    mutationFn: (id: string) => roundsApi.delete(id),
    onSuccess: () => {
      toast.success('Round deleted')
      void queryClient.invalidateQueries({ queryKey: ['rounds'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message ||
          'Cannot delete — candidates may be in this round'
      )
    },
  })

  return (
    <>
      <Card className="mt-6">
        <CardHeader>
          <div className="flex items-center justify-between gap-4">
            <div>
              <CardTitle>Interview Rounds</CardTitle>
              <CardDescription>
                Configure the interviewer for each round. Select a role to view
                and manage its rounds.
              </CardDescription>
            </div>
            <Button onClick={openAddModal} disabled={!selectedRole}>
              + Add Round
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <div className="mb-6 flex flex-wrap items-end gap-3">
            <div>
            <Label>Select Role</Label>
            <Select value={selectedRole} onValueChange={setSelectedRole}>
              <SelectTrigger className="w-64 mt-1">
                <SelectValue placeholder="Choose a role..." />
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
                'Sync Roles From Drive'
              )}
            </Button>
          </div>

          {roles.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-2)]">
              <p className="text-sm">No roles found yet.</p>
              <p className="mt-1 text-xs">
                Save your Drive folder in Integrations, then sync roles from the
                <code className="mx-1">rules/</code> folders.
              </p>
            </div>
          ) : isLoadingRounds ? (
            <div className="flex items-center gap-2 py-8 text-sm text-[var(--text-2)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading rounds...
            </div>
          ) : rounds.length === 0 ? (
            <div className="text-center py-12 text-[var(--text-2)]">
              <p className="text-sm">No rounds configured for this role yet.</p>
              <Button variant="outline" className="mt-4" onClick={openAddModal}>
                + Add First Round
              </Button>
            </div>
          ) : (
            <div className="space-y-3">
              {rounds.map((round) => (
                <div
                  key={round.id}
                  className="flex items-center gap-4 p-4 rounded-lg border border-[var(--border)] bg-[var(--muted)]/30"
                >
                  <div className="w-7 h-7 rounded-full bg-[var(--brand)] flex items-center justify-center text-xs font-bold text-white flex-shrink-0">
                    {round.roundNumber}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-semibold">{round.interviewerName}</p>
                    <p className="text-xs text-[var(--text-2)] font-mono mt-0.5">
                      {round.interviewerGmail}
                    </p>
                    {round.duration && (
                      <p className="text-xs text-[var(--text-2)] mt-0.5">
                        {round.duration}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openEditModal(round)}
                    >
                      Edit
                    </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      className="text-[var(--error)] hover:bg-[var(--error-light)] border-[var(--error)]/30"
                      onClick={() => {
                        if (window.confirm('Delete this round? This cannot be undone.')) {
                          deleteMutation.mutate(round.id)
                        }
                      }}
                      disabled={deleteMutation.isPending}
                    >
                      {deleteMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        'Delete'
                      )}
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={modalOpen} onOpenChange={setModalOpen}>
        <DialogContent className="sm:max-w-[460px]">
          <DialogHeader>
            <DialogTitle>
              {editingRound ? 'Edit Round' : 'Add Interview Round'}
            </DialogTitle>
            <DialogDescription>
              {editingRound
                ? `Editing Round ${editingRound.roundNumber} for ${selectedRole}`
                : `Adding a new round for ${selectedRole}`}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-2">
            <div>
              <Label>Round Number</Label>
              <Input
                className="mt-1"
                type="number"
                value={modalForm.roundNumber}
                onChange={(e) =>
                  setModalForm((f) => ({
                    ...f,
                    roundNumber: Number.parseInt(e.target.value || '1', 10),
                  }))
                }
                disabled={!!editingRound}
              />
            </div>
            <div>
              <Label>
                Interviewer Name <span className="text-[var(--error)]">*</span>
              </Label>
              <Input
                className="mt-1"
                value={modalForm.interviewerName}
                onChange={(e) =>
                  setModalForm((f) => ({
                    ...f,
                    interviewerName: e.target.value,
                  }))
                }
                placeholder="e.g. Rahul Sharma"
              />
            </div>
            <div>
              <Label>
                Interviewer Gmail <span className="text-[var(--error)]">*</span>
              </Label>
              <Input
                className="mt-1"
                type="email"
                value={modalForm.interviewerGmail}
                onChange={(e) =>
                  setModalForm((f) => ({
                    ...f,
                    interviewerGmail: e.target.value,
                  }))
                }
                placeholder="rahul@gmail.com"
              />
              <p className="text-xs text-[var(--text-2)] mt-1">
                Must match their Google login email exactly. Used for calendar
                access and invite link.
              </p>
            </div>
            <div>
              <Label>Duration (optional)</Label>
              <Select
                value={modalForm.duration || 'custom'}
                onValueChange={(value) => {
                  if (value === 'custom') {
                    setModalForm((f) => ({ ...f, duration: '' }))
                    return
                  }
                  setModalForm((f) => ({ ...f, duration: value }))
                }}
              >
                <SelectTrigger className="mt-1">
                  <SelectValue placeholder="Select duration" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="30 min">30 min</SelectItem>
                  <SelectItem value="45 min">45 min</SelectItem>
                  <SelectItem value="60 min">1 hour</SelectItem>
                  <SelectItem value="90 min">1.5 hours</SelectItem>
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
              <Input
                className="mt-2"
                value={modalForm.duration}
                onChange={(e) =>
                  setModalForm((f) => ({
                    ...f,
                    duration: e.target.value,
                  }))
                }
                placeholder="e.g. 45 min, 1 hour"
              />
              <p className="text-xs text-[var(--text-2)] mt-1">
                Saved when the backend has a `duration` column. Until then, the
                round still saves normally without it.
              </p>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button
              onClick={() => saveMutation.mutate()}
              disabled={
                saveMutation.isPending ||
                !modalForm.interviewerName ||
                !modalForm.interviewerGmail
              }
            >
              {saveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : editingRound ? (
                'Save Changes'
              ) : (
                'Add Round'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

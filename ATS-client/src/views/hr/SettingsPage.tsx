import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderSync, Mail, Plus, Trash2, Upload } from 'lucide-react'
import { ChangeEvent, useEffect, useRef, useState } from 'react'
import { companyApi, inviteApi, roundsApi, syncApi } from '../../api'
import { PageHeader } from '../../components/shared/PageHeader'
import { Button } from '../../components/ui/button'
import { Card, CardContent } from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { StageModal } from '../../components/settings/StageModal'
import { useRoles } from '../../hooks/useRoles'
import { useAuthStore } from '../../store/authStore'
import { Textarea } from '../../components/ui/textarea'
import type { InterviewRound } from '../../types'

export function SettingsPage() {
  const qc = useQueryClient()
  const company = useAuthStore((state) => state.company)
  const setCompany = useAuthStore((state) => state.setCompany)
  const { data: roles = [] } = useRoles()
  const [selectedRole, setSelectedRole] = useState('')
  const [profileForm, setProfileForm] = useState({
    name: company?.name ?? '',
    website: company?.website ?? '',
    description: company?.description ?? '',
    industry: company?.industry ?? '',
    size: company?.size ?? '',
    brandColor: company?.brandColor ?? '#EC5B24',
    logoUrl: company?.logoUrl ?? '',
  })
  const [inviteForm, setInviteForm] = useState({ roleName: '', roundNumber: '', email: '' })
  const [integrationForm, setIntegrationForm] = useState({ driveFolderLink: '', slackWebhookUrl: '', slackChannel: '' })
  const [message, setMessage] = useState('')
  const [editingRound, setEditingRound] = useState<InterviewRound | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const { data: rounds = [] } = useQuery({ queryKey: ['rounds', selectedRole], queryFn: () => roundsApi.list(selectedRole), enabled: Boolean(selectedRole), staleTime: 30_000 })
  const { data: inviteRounds = [] } = useQuery({
    queryKey: ['rounds', 'invite', inviteForm.roleName],
    queryFn: () => roundsApi.list(inviteForm.roleName),
    enabled: Boolean(inviteForm.roleName),
    staleTime: 30_000,
  })
  const { data: invites = [] } = useQuery({ queryKey: ['invites'], queryFn: inviteApi.list, staleTime: 30_000 })
  const { data: driveConfig } = useQuery({ queryKey: ['drive-config'], queryFn: companyApi.getDriveConfig, staleTime: 60_000 })
  const { data: syncStatus } = useQuery({ queryKey: ['sync-status'], queryFn: syncApi.status, refetchInterval: 3000 })
  const wasSyncRunning = useRef(false)
  const [stageModal, setStageModal] = useState(false)
  const profileMutation = useMutation({
    mutationFn: companyApi.updateProfile,
    onSuccess: (data) => {
      setCompany(data)
      qc.invalidateQueries({ queryKey: ['company'] })
      setMessage('Profile updated')
      const hexToHsl = (hex: string) => {
        const r = parseInt(hex.slice(1, 3), 16) / 255
        const g = parseInt(hex.slice(3, 5), 16) / 255
        const b = parseInt(hex.slice(5, 7), 16) / 255
        const max = Math.max(r, g, b)
        const min = Math.min(r, g, b)
        let h = 0
        let s = 0
        const l = (max + min) / 2
        if (max !== min) {
          const d = max - min
          s = l > 0.5 ? d / (2 - max - min) : d / (max + min)
          switch (max) {
            case r: h = (g - b) / d + (g < b ? 6 : 0); break
            case g: h = (b - r) / d + 2; break
            case b: h = (r - g) / d + 4; break
          }
          h /= 6
        }
        return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`
      }
      const updatedColor = data.brandColor || '#EC5B24'
      document.documentElement.style.setProperty('--brand', updatedColor)
      document.documentElement.style.setProperty('--primary', hexToHsl(updatedColor))
    },
  })
  const roundCreateMutation = useMutation({
    mutationFn: roundsApi.create,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rounds', selectedRole] })
      setStageModal(false)
      setEditingRound(null)
      setMessage('Round saved')
    },
  })
  const roundUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterviewRound> }) => roundsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rounds', selectedRole] })
      setStageModal(false)
      setEditingRound(null)
      setMessage('Round updated')
    },
  })
  const roundDeleteMutation = useMutation({
    mutationFn: roundsApi.remove,
    onSuccess: () => qc.invalidateQueries({ queryKey: ['rounds', selectedRole] }),
  })
  const inviteMutation = useMutation({
    mutationFn: inviteApi.generate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites'] })
      setMessage('Invite sent')
    },
  })
  const driveSaveMutation = useMutation({
    mutationFn: companyApi.saveDriveConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drive-config'] })
      setMessage('Drive settings saved')
    },
  })
  const syncMutation = useMutation({
    mutationFn: syncApi.start,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sync-status'] })
      setMessage('Sync started')
    },
    onError: (error: unknown) => {
      const status = error && typeof error === 'object' && 'response' in error
        ? (error as { response?: { status?: number } }).response?.status
        : undefined
      if (status === 409) {
        setMessage('Sync already running. Showing live progress below.')
        return
      }
      setMessage('Unable to start sync')
    },
  })

  useEffect(() => {
    const currentlyRunning = syncStatus?.isSyncRunning ?? false
    if (wasSyncRunning.current && !currentlyRunning) {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      qc.invalidateQueries({ queryKey: ['roles'] })
      qc.invalidateQueries({ queryKey: ['sync-status'] })
    }
    wasSyncRunning.current = currentlyRunning
  }, [qc, syncStatus])

  useEffect(() => {
    if (company) {
      setProfileForm({
        name: company.name ?? '',
        website: company.website ?? '',
        description: company.description ?? '',
        industry: company.industry ?? '',
        size: company.size ?? '',
        brandColor: company.brandColor ?? '#EC5B24',
        logoUrl: company.logoUrl ?? '',
      })
    }
  }, [company])

  const selectedRound = inviteRounds.find((round) => String(round.roundNumber) === inviteForm.roundNumber)
  const nextRoundNumber = rounds.length ? Math.max(...rounds.map((round) => round.roundNumber)) + 1 : 1

  const handleLogoUpload = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => {
      const result = typeof reader.result === 'string' ? reader.result : ''
      setProfileForm((current) => ({ ...current, logoUrl: result }))
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <PageHeader title="Settings" description="Manage your company profile, integrations, and interview workflows." />
      <Tabs defaultValue="company">
        <TabsList className="mb-6 w-full gap-8 border-b pb-0">
          <TabsTrigger value="company">Company Profile</TabsTrigger>
          <TabsTrigger value="rounds">Interview Rounds</TabsTrigger>
          <TabsTrigger value="invite">Invite Interviewers</TabsTrigger>
          <TabsTrigger value="integrations">Integrations</TabsTrigger>
        </TabsList>
        <TabsContent value="company">
          <Card className="border-[var(--border)] bg-[var(--bg-card)]"><CardContent className="grid gap-8 pt-6 lg:grid-cols-[320px_1fr]">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-[var(--text-1)]">Company Branding</p>
              <input ref={fileInputRef} type="file" accept=".png,.svg,image/png,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="flex h-48 w-full items-center justify-center rounded-[18px] border border-dashed bg-[var(--bg-page)]">
                <div className="text-center">
                  {profileForm.logoUrl
                    ? <img src={profileForm.logoUrl} alt="Company logo" className="mx-auto mb-4 h-20 w-20 rounded-full object-cover" />
                    : <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-[var(--brand)] text-2xl font-semibold text-white">{(profileForm.name || company?.name || 'A').slice(0, 1).toUpperCase()}</div>}
                  <p className="text-base font-medium">Upload company logo</p>
                  <p className="mt-1 text-sm text-[var(--text-2)]">PNG or SVG, 200x200 recommended</p>
                </div>
              </button>
            </div>
            <div className="space-y-5">
              <div className="grid gap-5 lg:grid-cols-[260px_1fr]">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-2)]">Brand colour</p>
                  <div className="flex items-center gap-4">
                    <div className="h-16 w-16 rounded-[18px] border-4 border-[var(--brand-mid)]" style={{ background: profileForm.brandColor }} />
                    <Input value={profileForm.brandColor} onChange={(e) => { setProfileForm((current) => ({ ...current, brandColor: e.target.value })); document.documentElement.style.setProperty('--brand', e.target.value) }} />
                  </div>
                </div>
                <div className="rounded-[16px] bg-[var(--brand-light)] p-4 text-sm text-[var(--text-2)]">
                  <p className="font-medium text-[var(--text-1)]">Live preview updates the entire interface</p>
                  <p className="mt-1">Sidebar accents, buttons, active tabs, and badges all follow the same company brand color.</p>
                </div>
              </div>
              <div className="grid gap-4 lg:grid-cols-2">
                <Input value={profileForm.name} onChange={(e) => setProfileForm((current) => ({ ...current, name: e.target.value }))} placeholder="Company Name" />
                <Input value={profileForm.website} onChange={(e) => setProfileForm((current) => ({ ...current, website: e.target.value }))} placeholder="Website" />
                <Input value={profileForm.industry} onChange={(e) => setProfileForm((current) => ({ ...current, industry: e.target.value }))} placeholder="Industry" />
                <Input value={profileForm.size} onChange={(e) => setProfileForm((current) => ({ ...current, size: e.target.value }))} placeholder="Company Size" />
              </div>
              <Textarea value={profileForm.description} onChange={(e) => setProfileForm((current) => ({ ...current, description: e.target.value }))} placeholder="Company description" />
              <div className="flex items-center gap-3">
                <Button onClick={() => profileMutation.mutate(profileForm)}>{profileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}</Button>
                {message ? <span className="text-sm text-[var(--brand)]">{message}</span> : null}
              </div>
            </div>
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="rounds">
          <Card><CardContent className="space-y-5 pt-6">
            <div className="flex items-center justify-between gap-4">
              <div className="w-full max-w-sm">
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-2)]">Select role</p>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger><SelectValue placeholder="Choose a role to manage rounds" /></SelectTrigger>
                  <SelectContent>{roles.map((role) => <SelectItem key={role.id} value={role.name}>{role.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button onClick={() => { setEditingRound(null); setStageModal(true) }} disabled={!selectedRole}><Plus className="h-4 w-4" /> Add Round</Button>
            </div>
            {rounds.map((round) => (
              <div key={round.id} className="flex items-center justify-between rounded-[14px] border bg-[var(--bg-card)] p-4">
                <div>
                  <p className="text-base font-semibold text-[var(--text-1)]">Round {round.roundNumber}</p>
                  <p className="mt-1 text-sm text-[var(--text-2)]">{round.interviewerName} • {round.interviewerGmail}</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="secondary" onClick={() => { setEditingRound(round); setStageModal(true) }}>Edit</Button>
                  <Button variant="ghost" onClick={() => roundDeleteMutation.mutate(round.id)}><Trash2 className="h-4 w-4" /></Button>
                </div>
              </div>
            ))}
            {!selectedRole ? <p className="text-sm text-[var(--text-2)]">Pick a role from the dropdown to view and manage its interview rounds.</p> : null}
            <StageModal
              open={stageModal}
              onOpenChange={setStageModal}
              round={editingRound}
              nextRoundNumber={nextRoundNumber}
              onSave={(data) => {
                if (!selectedRole) return
                if (editingRound?.id) {
                  roundUpdateMutation.mutate({ id: editingRound.id, data })
                  return
                }
                roundCreateMutation.mutate({ roleName: selectedRole, ...data })
              }}
            />
          </CardContent></Card>
        </TabsContent>
        <TabsContent value="invite">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <Card><CardContent className="space-y-4 pt-6">
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-2)]">Role</p>
                <Select value={inviteForm.roleName} onValueChange={(value) => { setInviteForm((current) => ({ ...current, roleName: value, roundNumber: '' })) }}>
                  <SelectTrigger><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent>{roles.map((role) => <SelectItem key={role.id} value={role.name}>{role.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-2)]">Round</p>
                <Select value={inviteForm.roundNumber} onValueChange={(value) => setInviteForm((current) => ({ ...current, roundNumber: value }))}>
                  <SelectTrigger><SelectValue placeholder="Select Round" /></SelectTrigger>
                  <SelectContent>{inviteRounds.map((round) => <SelectItem key={round.id} value={String(round.roundNumber)}>Round {round.roundNumber}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Input
                placeholder="Interviewer Email"
                value={inviteForm.email || selectedRound?.interviewerGmail || ''}
                onChange={(e) => setInviteForm((current) => ({ ...current, email: e.target.value }))}
              />
              <Button
                onClick={() => inviteMutation.mutate({ email: inviteForm.email || selectedRound?.interviewerGmail, roleName: inviteForm.roleName, roundNumber: Number(inviteForm.roundNumber) })}
                disabled={!inviteForm.roleName || !inviteForm.roundNumber || !(inviteForm.email || selectedRound?.interviewerGmail)}
              >
                <Mail className="h-4 w-4" /> Send Invite
              </Button>
              <p className="text-sm text-[var(--text-2)]">The backend creates the invite link internally. This flow keeps the UI clean and focused on sending, not copying.</p>
            </CardContent></Card>
            <Card><CardContent className="pt-6">
              <p className="mb-4 text-base font-semibold">Previously Sent Invites</p>
              <div className="grid grid-cols-4 gap-3 border-b pb-3 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-2)]">
                <span>Email</span><span>Role</span><span>Status</span><span>Sent</span>
              </div>
              {invites.map((invite) => (
                <div key={invite.id} className="grid grid-cols-4 gap-3 border-b py-3 text-sm last:border-b-0">
                  <span className="truncate">{invite.email}</span>
                  <span>{invite.roleName}</span>
                  <span className="capitalize">{invite.status}</span>
                  <span>{new Date(invite.sentAt).toLocaleDateString()}</span>
                </div>
              ))}
            </CardContent></Card>
          </div>
        </TabsContent>
        <TabsContent value="integrations">
          <div className="space-y-6">
            <Card><CardContent className="space-y-4 pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-base font-semibold">Google Drive</p>
                  <p className="mt-1 text-sm text-[var(--text-2)]">Connect the Resume-ATS folder used for imported resumes and manual uploads.</p>
                </div>
                {driveConfig?.driveFolderLink ? <span className="rounded-full bg-[var(--success-light)] px-3 py-1 text-xs text-[var(--success)]">Connected</span> : null}
              </div>
              <Input placeholder="Drive folder link" value={integrationForm.driveFolderLink || driveConfig?.driveFolderLink || ''} onChange={(e) => setIntegrationForm((current) => ({ ...current, driveFolderLink: e.target.value }))} />
              <div className="flex gap-3">
                <Button onClick={() => driveSaveMutation.mutate({ driveFolderLink: integrationForm.driveFolderLink || driveConfig?.driveFolderLink || '' })}>Save</Button>
                <Button variant="secondary" onClick={() => syncMutation.mutate()}><FolderSync className="h-4 w-4" /> Sync Now</Button>
              </div>
              {syncStatus?.isSyncRunning ? <div className="space-y-2"><div className="h-2 rounded-full bg-[var(--bg-hover)]"><div className="h-full rounded-full bg-[var(--brand)]" style={{ width: `${((syncStatus.processed ?? 0) / Math.max(syncStatus.total ?? 1, 1)) * 100}%` }} /></div><p className="text-sm text-[var(--text-2)]">Sync running. Processed {syncStatus.processed ?? 0} candidates so far.</p></div> : null}
            </CardContent></Card>
            <Card><CardContent className="space-y-4 pt-6">
              <p className="text-base font-semibold">Slack</p>
              <Input placeholder="Webhook URL" value={integrationForm.slackWebhookUrl} onChange={(e) => setIntegrationForm((current) => ({ ...current, slackWebhookUrl: e.target.value }))} />
              <Input placeholder="#channel-name" value={integrationForm.slackChannel} onChange={(e) => setIntegrationForm((current) => ({ ...current, slackChannel: e.target.value }))} />
              <div className="flex gap-3"><Button variant="secondary">Test</Button><Button>Save</Button></div>
            </CardContent></Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { FolderSync, Mail, Plus, Trash2, Upload, Sparkles } from 'lucide-react'
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
    <div className="space-y-8 pb-10">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight text-white mb-1">Settings</h1>
          <p className="text-muted-foreground text-sm">Manage your company profile, integrations, and interview workflows.</p>
        </div>
      </div>
      <Tabs defaultValue="company">
        <TabsList className="mb-8 w-full justify-start gap-2 bg-transparent p-0 border-b border-white/10 rounded-none h-auto">
          <TabsTrigger value="company" className="rounded-none rounded-t-lg border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-white/5 px-6 py-3 text-sm data-[state=active]:text-white text-muted-foreground transition-all">Company Profile</TabsTrigger>
          <TabsTrigger value="rounds" className="rounded-none rounded-t-lg border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-white/5 px-6 py-3 text-sm data-[state=active]:text-white text-muted-foreground transition-all">Interview Rounds</TabsTrigger>
          <TabsTrigger value="invite" className="rounded-none rounded-t-lg border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-white/5 px-6 py-3 text-sm data-[state=active]:text-white text-muted-foreground transition-all">Invite Interviewers</TabsTrigger>
          <TabsTrigger value="integrations" className="rounded-none rounded-t-lg border-b-2 border-transparent data-[state=active]:border-brand data-[state=active]:bg-white/5 px-6 py-3 text-sm data-[state=active]:text-white text-muted-foreground transition-all">Integrations</TabsTrigger>
        </TabsList>
        <TabsContent value="company" className="mt-0">
          <div className="glass-card"><div className="grid gap-8 p-8 lg:grid-cols-[320px_1fr]">
            <div className="space-y-4">
              <p className="text-sm font-semibold text-white">Company Branding</p>
              <input ref={fileInputRef} type="file" accept=".png,.svg,image/png,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
              <button type="button" onClick={() => fileInputRef.current?.click()} className="group flex h-56 w-full flex-col items-center justify-center rounded-2xl border-2 border-dashed border-white/10 bg-white/5 transition-all hover:border-brand/50 hover:bg-white/10">
                <div className="text-center transition-transform group-hover:scale-105">
                  {profileForm.logoUrl
                    ? <img src={profileForm.logoUrl} alt="Company logo" className="mx-auto mb-4 h-24 w-24 rounded-full object-cover ring-4 ring-white/10" />
                    : <div className="mx-auto mb-4 flex h-20 w-20 items-center justify-center rounded-full bg-gradient-to-br from-brand to-brand/60 text-3xl font-bold text-white shadow-lg shadow-brand/20">{(profileForm.name || company?.name || 'A').slice(0, 1).toUpperCase()}</div>}
                  <p className="text-sm font-medium text-white group-hover:text-brand transition-colors">Upload company logo</p>
                  <p className="mt-1 text-xs text-muted-foreground">PNG or SVG, 200x200 recommended</p>
                </div>
              </button>
            </div>
            <div className="space-y-6">
              <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
                <div>
                  <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Brand colour</p>
                  <div className="flex items-center gap-4">
                    <div className="h-14 w-14 rounded-xl border-2 border-white/20 shadow-inner" style={{ background: profileForm.brandColor }} />
                    <Input className="bg-white/5 border-white/10 text-white rounded-xl focus:border-brand" value={profileForm.brandColor} onChange={(e) => { setProfileForm((current) => ({ ...current, brandColor: e.target.value })); document.documentElement.style.setProperty('--brand', e.target.value) }} />
                  </div>
                </div>
                <div className="rounded-xl bg-brand/10 border border-brand/20 p-5 text-sm text-brand/90 backdrop-blur-sm">
                  <p className="font-semibold text-brand-light flex items-center gap-2"><Sparkles className="h-4 w-4" /> Live Preview Active</p>
                  <p className="mt-2 leading-relaxed">Sidebar accents, glowing buttons, active tabs, and badges instantly update to reflect your custom brand color across the entire platform.</p>
                </div>
              </div>
              <div className="grid gap-5 lg:grid-cols-2">
                <Input className="bg-white/5 border-white/10 text-white rounded-xl" value={profileForm.name} onChange={(e) => setProfileForm((current) => ({ ...current, name: e.target.value }))} placeholder="Company Name" />
                <Input className="bg-white/5 border-white/10 text-white rounded-xl" value={profileForm.website} onChange={(e) => setProfileForm((current) => ({ ...current, website: e.target.value }))} placeholder="Website" />
                <Input className="bg-white/5 border-white/10 text-white rounded-xl" value={profileForm.industry} onChange={(e) => setProfileForm((current) => ({ ...current, industry: e.target.value }))} placeholder="Industry" />
                <Input className="bg-white/5 border-white/10 text-white rounded-xl" value={profileForm.size} onChange={(e) => setProfileForm((current) => ({ ...current, size: e.target.value }))} placeholder="Company Size" />
              </div>
              <Textarea className="bg-white/5 border-white/10 text-white rounded-xl min-h-[120px]" value={profileForm.description} onChange={(e) => setProfileForm((current) => ({ ...current, description: e.target.value }))} placeholder="Company description" />
              <div className="flex items-center gap-4 pt-2">
                <Button className="btn-primary-glow rounded-xl px-6" onClick={() => profileMutation.mutate(profileForm)}>{profileMutation.isPending ? 'Saving...' : 'Save Profile Changes'}</Button>
                {message ? <span className="text-sm font-medium text-emerald-400 bg-emerald-400/10 px-3 py-1.5 rounded-lg">{message}</span> : null}
              </div>
            </div>
          </div></div>
        </TabsContent>
        <TabsContent value="rounds" className="mt-0">
          <div className="glass-card"><div className="space-y-6 p-8">
            <div className="flex items-center justify-between gap-4">
              <div className="w-full max-w-sm">
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Select role</p>
                <Select value={selectedRole} onValueChange={setSelectedRole}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl"><SelectValue placeholder="Choose a role to manage rounds" /></SelectTrigger>
                  <SelectContent>{roles.map((role) => <SelectItem key={role.id} value={role.name}>{role.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Button className="btn-primary-glow rounded-xl" onClick={() => { setEditingRound(null); setStageModal(true) }} disabled={!selectedRole}><Plus className="mr-2 h-4 w-4" /> Add Round</Button>
            </div>
            <div className="space-y-3">
              {rounds.map((round) => (
                <div key={round.id} className="flex items-center justify-between rounded-xl border border-white/5 bg-white/[0.02] hover:bg-white/[0.04] p-5 transition-colors">
                  <div>
                    <p className="text-base font-semibold text-white">Round {round.roundNumber}</p>
                    <p className="mt-1 text-sm text-muted-foreground">{round.interviewerName} • <span className="text-brand/80">{round.interviewerGmail}</span></p>
                  </div>
                  <div className="flex gap-2">
                    <Button variant="secondary" className="rounded-lg bg-white/5 hover:bg-white/10 border-white/10 text-white" onClick={() => { setEditingRound(round); setStageModal(true) }}>Edit</Button>
                    <Button variant="ghost" className="rounded-lg text-rose-400 hover:text-rose-300 hover:bg-rose-500/10" onClick={() => roundDeleteMutation.mutate(round.id)}><Trash2 className="h-4 w-4" /></Button>
                  </div>
                </div>
              ))}
              {!selectedRole ? <p className="text-sm text-muted-foreground text-center py-10 bg-white/[0.01] rounded-xl border border-white/5">Pick a role from the dropdown to view and manage its interview rounds.</p> : null}
            </div>
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
          </div></div>
        </TabsContent>
        <TabsContent value="invite" className="mt-0">
          <div className="grid gap-6 lg:grid-cols-[1fr_1.1fr]">
            <div className="glass-card"><div className="space-y-5 p-8">
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Role</p>
                <Select value={inviteForm.roleName} onValueChange={(value) => { setInviteForm((current) => ({ ...current, roleName: value, roundNumber: '' })) }}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl"><SelectValue placeholder="Select Role" /></SelectTrigger>
                  <SelectContent>{roles.map((role) => <SelectItem key={role.id} value={role.name}>{role.title}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <div>
                <p className="mb-2 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Round</p>
                <Select value={inviteForm.roundNumber} onValueChange={(value) => setInviteForm((current) => ({ ...current, roundNumber: value }))}>
                  <SelectTrigger className="bg-white/5 border-white/10 text-white rounded-xl"><SelectValue placeholder="Select Round" /></SelectTrigger>
                  <SelectContent>{inviteRounds.map((round) => <SelectItem key={round.id} value={String(round.roundNumber)}>Round {round.roundNumber}</SelectItem>)}</SelectContent>
                </Select>
              </div>
              <Input
                className="bg-white/5 border-white/10 text-white rounded-xl"
                placeholder="Interviewer Email"
                value={inviteForm.email || selectedRound?.interviewerGmail || ''}
                onChange={(e) => setInviteForm((current) => ({ ...current, email: e.target.value }))}
              />
              <Button
                className="btn-primary-glow rounded-xl w-full"
                onClick={() => inviteMutation.mutate({ email: inviteForm.email || selectedRound?.interviewerGmail, roleName: inviteForm.roleName, roundNumber: Number(inviteForm.roundNumber) })}
                disabled={!inviteForm.roleName || !inviteForm.roundNumber || !(inviteForm.email || selectedRound?.interviewerGmail)}
              >
                <Mail className="mr-2 h-4 w-4" /> Send Invite
              </Button>
              <p className="text-[11px] text-muted-foreground leading-relaxed mt-4 bg-brand/5 p-3 rounded-lg border border-brand/10">The backend creates the invite link internally. This flow keeps the UI clean and focused on sending, not copying.</p>
            </div></div>
            <div className="glass-card flex flex-col"><div className="p-8 flex-1">
              <p className="mb-6 text-lg font-semibold text-white">Previously Sent Invites</p>
              <div className="grid grid-cols-4 gap-3 border-b border-white/10 pb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                <span>Email</span><span>Role</span><span>Status</span><span>Sent</span>
              </div>
              <div className="divide-y divide-white/5">
                {invites.map((invite) => (
                  <div key={invite.id} className="grid grid-cols-4 gap-3 py-4 text-sm text-white/80 items-center">
                    <span className="truncate font-medium">{invite.email}</span>
                    <span className="truncate text-brand/80">{invite.roleName}</span>
                    <span className={`capitalize px-2 py-1 rounded-md text-[10px] font-bold w-fit ${invite.status === 'used' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-blue-500/10 text-blue-400'}`}>{invite.status}</span>
                    <span className="text-xs">{new Date(invite.sentAt).toLocaleDateString()}</span>
                  </div>
                ))}
              </div>
            </div></div>
          </div>
        </TabsContent>
        <TabsContent value="integrations" className="mt-0">
          <div className="space-y-6">
            <div className="glass-card"><div className="space-y-5 p-8">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-lg font-semibold text-white flex items-center gap-2"><FolderSync className="text-brand h-5 w-5" /> Google Drive</p>
                  <p className="mt-1 text-sm text-muted-foreground">Connect the Resume-ATS folder used for imported resumes and manual uploads.</p>
                </div>
                {driveConfig?.driveFolderLink ? <span className="rounded-md bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 text-[11px] font-bold uppercase tracking-wider text-emerald-400">Connected</span> : null}
              </div>
              <Input className="bg-white/5 border-white/10 text-white rounded-xl" placeholder="Drive folder link" value={integrationForm.driveFolderLink || driveConfig?.driveFolderLink || ''} onChange={(e) => setIntegrationForm((current) => ({ ...current, driveFolderLink: e.target.value }))} />
              <div className="flex gap-3">
                <Button className="btn-primary-glow rounded-xl" onClick={() => driveSaveMutation.mutate({ driveFolderLink: integrationForm.driveFolderLink || driveConfig?.driveFolderLink || '' })}>Save Configuration</Button>
                <Button className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white" variant="secondary" onClick={() => syncMutation.mutate()}><FolderSync className="mr-2 h-4 w-4 text-brand" /> Sync Now</Button>
              </div>
              {syncStatus?.isSyncRunning ? <div className="space-y-3 mt-6 p-4 rounded-xl bg-white/5 border border-white/10"><div className="h-1.5 rounded-full bg-white/10 overflow-hidden"><div className="h-full rounded-full bg-brand shadow-[0_0_10px_rgba(249,115,22,0.8)]" style={{ width: `${((syncStatus.processed ?? 0) / Math.max(syncStatus.total ?? 1, 1)) * 100}%` }} /></div><p className="text-xs text-muted-foreground font-medium flex justify-between"><span>Syncing resumes...</span><span className="text-brand">{syncStatus.processed ?? 0} / {syncStatus.total ?? '?'} processed</span></p></div> : null}
            </div></div>
            <div className="glass-card"><div className="space-y-5 p-8">
              <p className="text-lg font-semibold text-white">Slack</p>
              <Input className="bg-white/5 border-white/10 text-white rounded-xl" placeholder="Webhook URL" value={integrationForm.slackWebhookUrl} onChange={(e) => setIntegrationForm((current) => ({ ...current, slackWebhookUrl: e.target.value }))} />
              <Input className="bg-white/5 border-white/10 text-white rounded-xl" placeholder="#channel-name" value={integrationForm.slackChannel} onChange={(e) => setIntegrationForm((current) => ({ ...current, slackChannel: e.target.value }))} />
              <div className="flex gap-3"><Button variant="secondary" className="rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-white">Test Connection</Button><Button className="btn-primary-glow rounded-xl">Save</Button></div>
            </div></div>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}

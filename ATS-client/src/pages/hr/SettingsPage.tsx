import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import {
  Building2,
  CheckCircle2,
  FolderSync,
  Link2,
  Mail,
  Plus,
  Search,
  Trash2,
  Upload,
  Users,
} from 'lucide-react'
import { useRef, useState } from 'react'
import type { ChangeEvent, ReactNode } from 'react'
import { companyApi, inviteApi, roundsApi, syncApi } from '../../api'
import { StageModal } from '../../components/settings/StageModal'
import { Button } from '../../components/ui/button'
import { Input } from '../../components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../../components/ui/select'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../components/ui/tabs'
import { Textarea } from '../../components/ui/textarea'
import { useRoles } from '../../hooks/useRoles'
import { useAuthStore } from '../../store/authStore'
import type { Company, InterviewRound } from '../../types'

const brandOrange = '#EC5B24'

function SectionTitle({
  icon,
  title,
  description,
}: {
  icon: ReactNode
  title: string
  description: string
}) {
  return (
    <div className="mb-5 flex items-start gap-3">
      <div className="mt-0.5 flex h-9 w-9 items-center justify-center rounded-[9px] border border-[#e5e7eb] bg-[#f8fafc] text-[#344054]">
        {icon}
      </div>
      <div>
        <h2 className="text-[17px] font-semibold tracking-[-0.015em] text-[#0b1220]">{title}</h2>
        <p className="mt-1 text-[13px] leading-5 text-[#667085]">{description}</p>
      </div>
    </div>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <label className="block">
      <span className="mb-2 block text-[12px] font-semibold text-[#344054]">{label}</span>
      {children}
    </label>
  )
}

export function SettingsPage() {
  const qc = useQueryClient()
  const company = useAuthStore((state) => state.company)
  const setCompany = useAuthStore((state) => state.setCompany)
  const { data: roles = [], isLoading: rolesLoading, isError: rolesError } = useRoles()
  const [selectedRole, setSelectedRole] = useState('')
  const [typedRole, setTypedRole] = useState('')
  const [profileForm, setProfileForm] = useState<Partial<Company>>({
    name: company?.name ?? '',
    website: company?.website ?? '',
    description: company?.description ?? '',
    industry: company?.industry ?? '',
    size: company?.size ?? '',
    brandColor: company?.brandColor ?? brandOrange,
    logoUrl: company?.logoUrl ?? '',
  })
  const [inviteForm, setInviteForm] = useState({ roleName: '', roundNumber: '', email: '' })
  const [integrationForm, setIntegrationForm] = useState({ driveFolderLink: '', slackWebhookUrl: company?.slackWebhookUrl ?? '' })
  const [statusMessage, setStatusMessage] = useState('')
  const [editingRound, setEditingRound] = useState<InterviewRound | null>(null)
  const [stageModal, setStageModal] = useState(false)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const activeRoleName = selectedRole || typedRole.trim()

  const { data: rounds = [] } = useQuery({
    queryKey: ['rounds', activeRoleName],
    queryFn: () => roundsApi.list(activeRoleName),
    enabled: Boolean(activeRoleName),
    staleTime: 30_000,
  })
  const { data: inviteRounds = [] } = useQuery({
    queryKey: ['rounds', 'invite', inviteForm.roleName],
    queryFn: () => roundsApi.list(inviteForm.roleName),
    enabled: Boolean(inviteForm.roleName),
    staleTime: 30_000,
  })
  const { data: invites = [] } = useQuery({ queryKey: ['invites'], queryFn: inviteApi.list, staleTime: 30_000 })
  const { data: driveConfig } = useQuery({ queryKey: ['drive-config'], queryFn: companyApi.getDriveConfig, staleTime: 60_000 })
  const { data: syncStatus } = useQuery({ queryKey: ['sync-status'], queryFn: syncApi.status, refetchInterval: 3000 })

  const profileMutation = useMutation({
    mutationFn: companyApi.updateProfile,
    onSuccess: (data) => {
      setCompany(data)
      qc.invalidateQueries({ queryKey: ['company'] })
      document.documentElement.style.setProperty('--brand', data.brandColor || profileForm.brandColor || brandOrange)
      setStatusMessage('Settings saved')
    },
  })
  const roundCreateMutation = useMutation({
    mutationFn: roundsApi.create,
    onSuccess: (round) => {
      const savedRoleName = round.roleName || activeRoleName
      setSelectedRole(savedRoleName)
      setTypedRole('')
      qc.invalidateQueries({ queryKey: ['roles'] })
      qc.invalidateQueries({ queryKey: ['rounds', savedRoleName] })
      setStageModal(false)
      setEditingRound(null)
      setStatusMessage('Round saved')
    },
  })
  const roundUpdateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: Partial<InterviewRound> }) => roundsApi.update(id, data),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rounds', activeRoleName] })
      setStageModal(false)
      setEditingRound(null)
      setStatusMessage('Round updated')
    },
  })
  const roundDeleteMutation = useMutation({
    mutationFn: roundsApi.remove,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['rounds', activeRoleName] })
      setStatusMessage('Round removed')
    },
  })
  const inviteMutation = useMutation({
    mutationFn: inviteApi.generate,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['invites'] })
      setStatusMessage('Invite sent')
    },
  })
  const driveSaveMutation = useMutation({
    mutationFn: companyApi.saveDriveConfig,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['drive-config'] })
      setStatusMessage('Drive settings saved')
    },
  })
  const syncMutation = useMutation({
    mutationFn: syncApi.start,
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['sync-status'] })
      setStatusMessage('Sync started')
    },
  })

  const selectedRound = inviteRounds.find((round) => String(round.roundNumber) === inviteForm.roundNumber)
  const nextRoundNumber = rounds.length ? Math.max(...rounds.map((round) => round.roundNumber)) + 1 : 1
  const brandColor = profileForm.brandColor || brandOrange
  const companyInitial = (profileForm.name || company?.name || 'C').slice(0, 1).toUpperCase()

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

  const updateBrand = (value: string) => {
    setProfileForm((current) => ({ ...current, brandColor: value }))
    document.documentElement.style.setProperty('--brand', value)
  }

  return (
    <div className="min-h-[calc(100vh-48px)] bg-[#f6f8fb] text-[#101828]">
      <div className="bg-white/95 px-8 py-7 shadow-[inset_0_-1px_0_#eef2f6]">
        <div className="mx-auto flex max-w-[1280px] items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] text-[#1f2937]">
              <Building2 className="h-4 w-4" />
            </div>
            <div>
              <h1 className="text-[30px] font-semibold tracking-[-0.035em] text-[#0b1220]">Settings</h1>
              <p className="mt-1 text-[14px] text-[#667085]">Manage company settings, workflows, and integrations.</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            {statusMessage ? (
              <div className="flex items-center gap-2 rounded-full bg-[#ecfdf3] px-3 py-1.5 text-[12px] font-medium text-[#027a48]">
                <CheckCircle2 className="h-3.5 w-3.5" />
                {statusMessage}
              </div>
            ) : null}
            <button className="rounded-[8px] p-2 text-[#344054] transition hover:bg-[#eef2f6]" type="button" aria-label="Search settings">
              <Search className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      <Tabs defaultValue="profile">
        <div className="mx-auto max-w-[1280px] px-8 pt-6">
        <TabsList className="w-full gap-1 rounded-[10px] border border-[#e5e7eb] bg-[#f8fafc] p-1 shadow-[0_1px_2px_rgba(16,24,40,0.04)]">
          {[
            ['profile', 'Basic Info'],
            ['rounds', 'Interview Rounds'],
            ['invites', 'Team Invites'],
            ['integrations', 'Integrations'],
          ].map(([value, label]) => (
            <TabsTrigger
              key={value}
              value={value}
              className="rounded-[7px] border-b-0 px-5 py-2.5 text-[13px] font-semibold text-[#667085] transition hover:text-[#101828] data-[state=active]:border-transparent data-[state=active]:bg-white data-[state=active]:text-[#0b1220] data-[state=active]:shadow-[0_1px_2px_rgba(16,24,40,0.08)]"
            >
              {label}
            </TabsTrigger>
          ))}
        </TabsList>
        </div>

        <div className="mx-auto max-w-[1280px] px-8 py-7">
          <TabsContent value="profile" className="max-w-[1120px]">
            <SectionTitle icon={<Building2 className="h-4 w-4" />} title="Company profile" description="Update your public company identity and profile details." />

            <div className="space-y-6">
              <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.035)]">
                <div className="grid gap-7 md:grid-cols-[220px_1fr]">
                  <input ref={fileInputRef} type="file" accept=".png,.svg,image/png,image/svg+xml" className="hidden" onChange={handleLogoUpload} />
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="flex h-[176px] flex-col items-center justify-center rounded-[10px] border border-dashed border-[#cfd5df] bg-[#fbfcfd] text-center transition hover:border-[#667085] hover:bg-white"
                  >
                    {profileForm.logoUrl ? (
                      <img src={profileForm.logoUrl} alt="Company logo" className="h-14 w-14 rounded-full object-cover" />
                    ) : (
                      <div className="flex h-14 w-14 items-center justify-center rounded-full text-xl font-semibold text-white" style={{ background: brandColor }}>
                        {companyInitial}
                      </div>
                    )}
                    <span className="mt-3 flex items-center gap-1.5 text-[13px] font-medium text-[#344054]"><Upload className="h-3.5 w-3.5" /> Upload logo</span>
                    <span className="mt-1 text-[11px] text-[#98a2b3]">PNG or SVG, 200x200 ideal</span>
                  </button>

                <div className="grid content-start gap-5 md:grid-cols-2">
                    <Field label="Company name">
                      <Input value={profileForm.name ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, name: event.target.value }))} placeholder="Company name" />
                    </Field>
                    <Field label="Website">
                      <Input value={profileForm.website ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, website: event.target.value }))} placeholder="https://company.com" />
                    </Field>
                    <Field label="Industry">
                      <Input value={profileForm.industry ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, industry: event.target.value }))} placeholder="Industry" />
                    </Field>
                    <Field label="Company size">
                      <Input value={profileForm.size ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, size: event.target.value }))} placeholder="Company size" />
                    </Field>
                  </div>
                </div>
              </div>

              <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.035)]">
                <SectionTitle icon={<Link2 className="h-4 w-4" />} title="Brand settings" description="Use your brand colour throughout the ATS workspace." />
                <div className="grid gap-5 md:grid-cols-[240px_1fr]">
                  <Field label="Brand colour">
                    <div className="flex gap-3">
                      <input type="color" value={brandColor} onChange={(event) => updateBrand(event.target.value)} className="h-10 w-12 cursor-pointer rounded-md border border-[#d0d5dd] bg-white p-1" />
                      <Input value={brandColor} onChange={(event) => updateBrand(event.target.value)} className="uppercase" />
                    </div>
                  </Field>
                  <Field label="Description">
                    <Textarea value={profileForm.description ?? ''} onChange={(event) => setProfileForm((current) => ({ ...current, description: event.target.value }))} placeholder="Short company overview for candidate-facing templates" />
                  </Field>
                </div>
              </div>

              <div className="sticky bottom-0 -mx-1 flex justify-end border-t border-[#e5e7eb] bg-[#f6f8fb]/95 px-1 py-4 backdrop-blur">
                <Button
                  onClick={() => profileMutation.mutate(profileForm)}
                  disabled={profileMutation.isPending}
                  className="h-11 rounded-[8px] bg-[#ec5b24] px-5 text-[13px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.12)] hover:bg-[#dd4f1b]"
                >
                  {profileMutation.isPending ? 'Saving...' : 'Save changes'}
                </Button>
              </div>
            </div>
          </TabsContent>

          <TabsContent value="rounds" className="max-w-[1120px]">
            <SectionTitle icon={<Users className="h-4 w-4" />} title="Interview rounds" description="Configure the sequence and interviewer for each role." />
            <div className="space-y-5">
              <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-start">
                <div className="flex-1">
                  <Field label="Role">
                    {roles.length ? (
                      <Select
                        value={selectedRole}
                        onValueChange={(value) => {
                          setSelectedRole(value)
                          setTypedRole('')
                        }}
                      >
                        <SelectTrigger><SelectValue placeholder="Choose a role" /></SelectTrigger>
                        <SelectContent>{roles.map((role) => <SelectItem key={role.id} value={role.name}>{role.title}</SelectItem>)}</SelectContent>
                      </Select>
                    ) : (
                      <Input
                        value={typedRole}
                        onChange={(event) => setTypedRole(event.target.value)}
                        placeholder={rolesLoading ? 'Loading roles...' : 'Type a role name'}
                        disabled={rolesLoading}
                      />
                    )}
                  </Field>
                  {rolesError ? <p className="mt-2 text-[12px] text-[#b42318]">Could not load roles. You can still type a role name manually.</p> : null}
                  {!rolesLoading && !roles.length && !rolesError ? <p className="mt-2 text-[12px] text-[#667085]">No roles found yet. Type the exact role name you use for candidates.</p> : null}
                </div>
                <Button
                  variant="dark"
                  onClick={() => { setEditingRound(null); setStageModal(true) }}
                  disabled={!activeRoleName}
                  className="mt-[28px] h-[42px] rounded-[8px] border border-[#111827] px-4 text-[13px] font-semibold shadow-[0_1px_2px_rgba(16,24,40,0.12)] disabled:border-[#d0d5dd] disabled:bg-[#f2f4f7] disabled:text-[#98a2b3] disabled:opacity-100"
                >
                  <Plus className="h-4 w-4" /> Add round
                </Button>
              </div>

              <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.035)]">
                {rounds.map((round) => (
                    <div key={round.id} className="grid grid-cols-[110px_1fr_auto] items-center gap-4 border-b border-[#edf0f3] px-5 py-4 last:border-b-0">
                    <span className="text-[13px] font-medium text-[#101828]">Round {round.roundNumber}</span>
                    <span className="text-[13px] text-[#667085]">{round.interviewerName} - {round.interviewerGmail}</span>
                    <div className="flex gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditingRound(round); setStageModal(true) }}>Edit</Button>
                      <Button size="sm" variant="ghost" onClick={() => roundDeleteMutation.mutate(round.id)}><Trash2 className="h-4 w-4" /></Button>
                    </div>
                  </div>
                ))}
                {!rounds.length ? <p className="px-4 py-5 text-[13px] text-[#98a2b3]">No rounds configured yet.</p> : null}
              </div>
            </div>
            <StageModal
              open={stageModal}
              onOpenChange={setStageModal}
              round={editingRound}
              nextRoundNumber={nextRoundNumber}
              onSave={(data) => {
                if (!activeRoleName) return
                if (editingRound?.id) {
                  roundUpdateMutation.mutate({ id: editingRound.id, data })
                  return
                }
                roundCreateMutation.mutate({ roleName: activeRoleName, ...data })
              }}
            />
          </TabsContent>

          <TabsContent value="invites" className="max-w-[1120px]">
            <SectionTitle icon={<Mail className="h-4 w-4" />} title="Team invites" description="Invite interviewers and track invitation history." />
            <div className="space-y-7">
              <div className="grid gap-5 rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.035)] md:grid-cols-3">
                <Field label="Role">
                  <Select value={inviteForm.roleName} onValueChange={(value) => setInviteForm((current) => ({ ...current, roleName: value, roundNumber: '' }))}>
                    <SelectTrigger><SelectValue placeholder="Select role" /></SelectTrigger>
                    <SelectContent>{roles.map((role) => <SelectItem key={role.id} value={role.name}>{role.title}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Round">
                  <Select value={inviteForm.roundNumber} onValueChange={(value) => setInviteForm((current) => ({ ...current, roundNumber: value }))}>
                    <SelectTrigger><SelectValue placeholder="Select round" /></SelectTrigger>
                    <SelectContent>{inviteRounds.map((round) => <SelectItem key={round.id} value={String(round.roundNumber)}>Round {round.roundNumber}</SelectItem>)}</SelectContent>
                  </Select>
                </Field>
                <Field label="Email">
                  <Input value={inviteForm.email || selectedRound?.interviewerGmail || ''} onChange={(event) => setInviteForm((current) => ({ ...current, email: event.target.value }))} placeholder="interviewer@company.com" />
                </Field>
                <div className="md:col-span-3">
                  <Button
                    onClick={() => inviteMutation.mutate({ email: inviteForm.email || selectedRound?.interviewerGmail, roleName: inviteForm.roleName, roundNumber: Number(inviteForm.roundNumber) })}
                    disabled={!inviteForm.roleName || !inviteForm.roundNumber || !(inviteForm.email || selectedRound?.interviewerGmail)}
                  >
                    <Mail className="h-4 w-4" /> Send invite
                  </Button>
                </div>
              </div>

              <div className="overflow-hidden rounded-[14px] border border-[#e5e7eb] bg-white shadow-[0_8px_24px_rgba(16,24,40,0.035)]">
                <div className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr] bg-[#f7f8fa] px-5 py-3 text-[12px] font-medium text-[#667085]">
                  <span>Email</span><span>Role</span><span>Status</span><span>Sent</span>
                </div>
                {invites.map((invite) => (
                  <div key={invite.id} className="grid grid-cols-[1.4fr_1fr_0.8fr_0.8fr] border-t border-[#edf0f3] px-5 py-4 text-[13px]">
                    <span>{invite.email}</span>
                    <span>{invite.roleName}</span>
                    <span>{invite.status}</span>
                    <span>{new Date(invite.sentAt).toLocaleDateString()}</span>
                  </div>
                ))}
                {!invites.length ? <p className="border-t border-[#edf0f3] px-4 py-5 text-[13px] text-[#98a2b3]">No invites sent yet.</p> : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="integrations" className="max-w-[1120px]">
            <SectionTitle icon={<FolderSync className="h-4 w-4" />} title="Integrations" description="Connect resume import and notification services." />
            <div className="space-y-7">
              <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.035)]">
                <SectionTitle icon={<FolderSync className="h-4 w-4" />} title="Google Drive" description="Connect the folder used for resume import and syncing." />
                <div className="space-y-4">
                  <Input placeholder="Drive folder link" value={integrationForm.driveFolderLink || driveConfig?.driveFolderLink || ''} onChange={(event) => setIntegrationForm((current) => ({ ...current, driveFolderLink: event.target.value }))} />
                  <div className="flex gap-3">
                    <Button onClick={() => driveSaveMutation.mutate({ driveFolderLink: integrationForm.driveFolderLink || driveConfig?.driveFolderLink || '' })}>Save</Button>
                    <Button variant="secondary" onClick={() => syncMutation.mutate()}><FolderSync className="h-4 w-4" /> Sync now</Button>
                  </div>
                  {syncStatus?.isSyncRunning ? <p className="text-[13px] text-[#667085]">Sync running. Processed {syncStatus.processed ?? 0} candidates so far.</p> : null}
                </div>
              </div>
              <div className="rounded-[14px] border border-[#e5e7eb] bg-white p-6 shadow-[0_8px_24px_rgba(16,24,40,0.035)]">
                <SectionTitle icon={<Link2 className="h-4 w-4" />} title="Slack" description="Send candidate and interview updates to your hiring channel." />
                <div className="grid gap-4">
                  <Input placeholder="Webhook URL" value={integrationForm.slackWebhookUrl} onChange={(event) => setIntegrationForm((current) => ({ ...current, slackWebhookUrl: event.target.value }))} />
                  <Button className="w-fit" onClick={() => profileMutation.mutate({ slackWebhookUrl: integrationForm.slackWebhookUrl })}>Save</Button>
                </div>
              </div>
            </div>
          </TabsContent>
        </div>
      </Tabs>
    </div>
  )
}

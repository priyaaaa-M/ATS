import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { companyApi, slackApi, syncApi } from '../../api'
import { Button } from '../../components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '../../components/ui/card'
import { Checkbox } from '../../components/ui/checkbox'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'
import { formatDate } from '../../lib/utils'

const slackEvents = [
  'new_candidate_parsed',
  'candidate_approved',
  'interview_scheduled',
  'candidate_advanced',
  'candidate_selected',
]

export function IntegrationsTab() {
  const queryClient = useQueryClient()
  const [driveLink, setDriveLink] = useState('')
  const [slackWebhook, setSlackWebhook] = useState('')
  const [slackChannel, setSlackChannel] = useState('')
  const [isSyncing, setIsSyncing] = useState(false)
  const [notifyEvents, setNotifyEvents] = useState<string[]>(slackEvents)

  const { data: driveConfig } = useQuery({
    queryKey: ['drive-config'],
    queryFn: () => companyApi.getDriveConfig(),
  })

  const { data: syncStatus, refetch: refetchStatus } = useQuery({
    queryKey: ['sync-status'],
    queryFn: () => syncApi.getStatus(),
    refetchInterval: isSyncing ? 3000 : false,
  })

  useEffect(() => {
    if (driveConfig) {
      setDriveLink(driveConfig.driveFolderLink || '')
      setSlackWebhook(driveConfig.slackWebhookUrl || '')
      setSlackChannel(driveConfig.slackChannel || '')
      setNotifyEvents(driveConfig.slackNotifyEvents || slackEvents)
    }
  }, [driveConfig])

  const wasSyncRunning = useRef(false)

  useEffect(() => {
    if (syncStatus && !syncStatus.isSyncRunning) {
      setIsSyncing(false)
    }
  }, [syncStatus])

  useEffect(() => {
    const currentlyRunning = syncStatus?.isSyncRunning ?? false
    if (wasSyncRunning.current && !currentlyRunning) {
      void queryClient.invalidateQueries({ queryKey: ['candidates'] })
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      void queryClient.invalidateQueries({ queryKey: ['sync-status'] })
    }
    wasSyncRunning.current = currentlyRunning
  }, [queryClient, syncStatus])

  const saveDriveMutation = useMutation({
    mutationFn: () => companyApi.saveDriveConfig({ driveFolderLink: driveLink }),
    onSuccess: async () => {
      toast.success('Drive config saved')
      setIsSyncing(true)
      await queryClient.invalidateQueries({ queryKey: ['drive-config'] })
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      await queryClient.invalidateQueries({ queryKey: ['candidates'] })
      await queryClient.invalidateQueries({ queryKey: ['sync-status'] })
      try {
        await syncApi.triggerSync()
        toast.info('Drive sync started with the new folder')
        await refetchStatus()
      } catch (err: any) {
        setIsSyncing(false)
        toast.error(
          err.response?.data?.message || 'Drive saved, but sync failed to start'
        )
      }
    },
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to save Drive config'),
  })

  const syncMutation = useMutation({
    mutationFn: () => syncApi.triggerSync(),
    onSuccess: () => {
      setIsSyncing(true)
      toast.info('Sync started — checking for new resumes...')
      refetchStatus()
      void queryClient.invalidateQueries({ queryKey: ['roles'] })
      void queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Sync failed to start')
    },
  })

  const validateDriveMutation = useMutation({
    mutationFn: () => syncApi.validateDrive(),
    onSuccess: (result) => {
      if (result.valid) {
        toast.success(`Drive structure looks good: ${result.folders.length} source folders found`)
        return
      }
      toast.warning(result.issues[0]?.message || 'Drive structure needs attention')
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not validate Drive')
    },
  })

  const testSlackMutation = useMutation({
    mutationFn: async () => {
      await companyApi.updateProfile({
        slackWebhookUrl: slackWebhook,
        slackChannel,
        slackNotifyEvents: notifyEvents,
      })
      return slackApi.test()
    },
    onSuccess: () => {
      toast.success('Test notification sent to Slack!')
    },
    onError: (err: any) => {
      toast.error(
        err.response?.data?.message || 'Failed to test Slack connection'
      )
    },
  })

  const saveSlackMutation = useMutation({
    mutationFn: () =>
      companyApi.updateProfile({
        slackWebhookUrl: slackWebhook,
        slackChannel,
        slackNotifyEvents: notifyEvents,
      }),
    onSuccess: () => toast.success('Slack config saved'),
    onError: (err: any) =>
      toast.error(err.response?.data?.message || 'Failed to save Slack config'),
  })

  const toggleEvent = (eventName: string) => {
    setNotifyEvents((current) =>
      current.includes(eventName)
        ? current.filter((event) => event !== eventName)
        : [...current, eventName]
    )
  }

  const isDriveConnected = Boolean(driveLink)
  const isSlackConnected = Boolean(slackWebhook)

  return (
    <div className="grid gap-6 mt-6 xl:grid-cols-2">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>🗂 Google Drive</CardTitle>
              <CardDescription>
                Connect the source folder where resumes are uploaded and synced.
              </CardDescription>
            </div>
            <div className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
              {isDriveConnected ? 'Connected' : 'Not connected'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col gap-3 md:flex-row">
            <Input
              value={driveLink}
              onChange={(e) => setDriveLink(e.target.value)}
              placeholder="Paste Google Drive folder link"
            />
            <Button
              onClick={() => saveDriveMutation.mutate()}
              disabled={!driveLink || saveDriveMutation.isPending}
            >
              {saveDriveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>

          <div className="flex items-center gap-3 p-3 rounded-lg bg-[var(--muted)]/30 border border-[var(--border)] mt-3">
            <div className="w-2 h-2 rounded-full bg-green-500" />
            <span className="text-sm text-[var(--text-2)] flex-1">
              Last synced: {formatDate(syncStatus?.lastSyncCompletedAt)}
              {' · '}
              {syncStatus?.totalProcessed ?? 0} candidates
            </span>
            <Button
              size="sm"
              variant="outline"
              onClick={() => validateDriveMutation.mutate()}
              disabled={validateDriveMutation.isPending || !isDriveConnected}
            >
              {validateDriveMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Checking...
                </>
              ) : (
                'Validate'
              )}
            </Button>
            <Button
              size="sm"
              variant="outline"
              onClick={() => syncMutation.mutate()}
              disabled={syncMutation.isPending || isSyncing}
            >
              {syncMutation.isPending || isSyncing ? (
                <>
                  <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                  Syncing {syncStatus?.totalProcessed ?? 0}...
                </>
              ) : (
                'Sync Now'
              )}
            </Button>
          </div>

          <div className="rounded-lg bg-[var(--muted)]/50 p-3 mt-3 text-xs text-[var(--text-2)] leading-relaxed">
            <strong className="text-[var(--text-1)]">Required structure:</strong>
            <br />
            resume_ats/ - rules/ - frontend/ - on-campus/ - resume.pdf
            <br />
            Each role folder should contain source folders like on-campus, referral, or agency.
          </div>
          {validateDriveMutation.data && (
            <div className="mt-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 p-3">
              <div className="mb-2 flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-2)]">
                  Validation result
                </p>
                <span className={validateDriveMutation.data.valid ? 'text-xs text-green-400' : 'text-xs text-yellow-400'}>
                  {validateDriveMutation.data.valid ? 'Ready' : 'Needs attention'}
                </span>
              </div>
              {validateDriveMutation.data.issues.map((issue) => (
                <p key={issue.type} className="mb-2 text-xs text-yellow-400">
                  {issue.message}
                </p>
              ))}
              <div className="grid gap-2 sm:grid-cols-2">
                {validateDriveMutation.data.folders.slice(0, 6).map((folder) => (
                  <div key={`${folder.roleName}-${folder.sourceName}`} className="rounded-md border border-[var(--border)] px-3 py-2 text-xs text-[var(--text-2)]">
                    <span className="font-medium text-[var(--text-1)]">{folder.roleName}</span>
                    {' / '}
                    {folder.sourceFolderName}
                    {' - '}
                    {folder.resumeCount} resumes
                  </div>
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between gap-3">
            <div>
              <CardTitle>💬 Slack</CardTitle>
              <CardDescription>
                Save your webhook and channel, then send a quick test message.
              </CardDescription>
            </div>
            <div className="rounded-full border border-green-500/30 bg-green-500/10 px-3 py-1 text-xs font-medium text-green-400">
              {isSlackConnected ? 'Connected' : 'Not connected'}
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            <div>
              <Label>Webhook URL</Label>
              <Input
                className="mt-1"
                value={slackWebhook}
                onChange={(e) => setSlackWebhook(e.target.value)}
                placeholder="https://hooks.slack.com/..."
              />
            </div>
            <div>
              <Label>Slack channel</Label>
              <Input
                className="mt-1"
                value={slackChannel}
                onChange={(e) => setSlackChannel(e.target.value)}
                placeholder="#great-hires-only"
              />
            </div>
          </div>

          <div className="mt-4 space-y-3">
            <Label>Notify on events</Label>
            <div className="grid gap-3 sm:grid-cols-2">
              {slackEvents.map((eventName) => (
                <label
                  key={eventName}
                  className="flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--muted)]/20 px-3 py-2 text-sm text-[var(--text-1)]"
                >
                  <Checkbox
                    checked={notifyEvents.includes(eventName)}
                    onCheckedChange={() => toggleEvent(eventName)}
                  />
                  <span>{eventName}</span>
                </label>
              ))}
            </div>
          </div>

          <div className="flex gap-2 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => testSlackMutation.mutate()}
              disabled={!slackWebhook || testSlackMutation.isPending}
            >
              {testSlackMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Testing...
                </>
              ) : (
                'Test'
              )}
            </Button>
            <Button
              size="sm"
              onClick={() => saveSlackMutation.mutate()}
              disabled={!slackWebhook || saveSlackMutation.isPending}
            >
              {saveSlackMutation.isPending ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                'Save'
              )}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

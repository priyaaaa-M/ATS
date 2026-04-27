'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { CheckCircle2, FolderSync, Slack } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { companyApi, syncApi } from '@/lib/api'

export function IntegrationsPanel() {
  const queryClient = useQueryClient()
  const [driveFolderLink, setDriveFolderLink] = useState('')
  const [slackWebhookUrl, setSlackWebhookUrl] = useState('')
  const [isPolling, setIsPolling] = useState(false)

  const { data: profile, isLoading: isProfileLoading } = useQuery({
    queryKey: ['company-profile'],
    queryFn: companyApi.getProfile,
  })

  const { data: driveConfig, isLoading: isDriveLoading } = useQuery({
    queryKey: ['drive-config'],
    queryFn: companyApi.getDriveConfig,
  })

  const { data: syncStatus } = useQuery({
    queryKey: ['sync-status'],
    queryFn: syncApi.getStatus,
    refetchInterval: isPolling ? 3000 : false,
  })

  useEffect(() => {
    if (driveConfig?.drive_folder_link) {
      setDriveFolderLink(driveConfig.drive_folder_link)
    }
  }, [driveConfig])

  useEffect(() => {
    if (profile?.slack_webhook_url) {
      setSlackWebhookUrl(profile.slack_webhook_url)
    }
  }, [profile])

  useEffect(() => {
    if (syncStatus && !syncStatus.is_sync_running) {
      setIsPolling(false)
    }
  }, [syncStatus])

  const saveDriveConfig = useMutation({
    mutationFn: companyApi.saveDriveConfig,
    onSuccess: () => {
      toast.success('Drive folder saved')
      queryClient.invalidateQueries({ queryKey: ['drive-config'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save drive config')
    },
  })

  const triggerSync = useMutation({
    mutationFn: syncApi.triggerSync,
    onSuccess: () => {
      toast.info('Sync started')
      setIsPolling(true)
      queryClient.invalidateQueries({ queryKey: ['sync-status'] })
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to start sync')
    },
  })

  const saveSlack = useMutation({
    mutationFn: (webhookUrl: string) => companyApi.updateProfile({ slackWebhookUrl: webhookUrl }),
    onSuccess: () => {
      toast.success('Slack webhook saved')
      queryClient.invalidateQueries({ queryKey: ['company-profile'] })
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save Slack webhook')
    },
  })

  if (isProfileLoading || isDriveLoading) {
    return <Skeleton className="h-[420px] w-full bg-surface-2" />
  }

  return (
    <div className="space-y-6">
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-[Syne]">
            <FolderSync className="h-5 w-5 text-primary" />
            Google Drive
          </CardTitle>
          <CardDescription>
            Connect the root Drive folder that contains `rules/role-name/resume.pdf`.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="drive-folder">Drive Folder Link</Label>
            <Input
              id="drive-folder"
              placeholder="https://drive.google.com/drive/folders/..."
              value={driveFolderLink}
              onChange={(event) => setDriveFolderLink(event.target.value)}
            />
          </div>

          {driveConfig?.drive_folder_link ? (
            <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success">
              <div className="flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4" />
                Drive connected
              </div>
              <p className="mt-1 break-all">{driveConfig.drive_folder_link}</p>
              <p className="mt-1 text-xs text-success/80">
                Last synced:{' '}
                {driveConfig.last_sync_at
                  ? new Date(driveConfig.last_sync_at).toLocaleString()
                  : 'Never'}
              </p>
            </div>
          ) : null}

          {syncStatus ? (
            <div className="rounded-xl border border-border bg-surface-2 p-3 text-sm">
              {syncStatus.is_sync_running
                ? `Syncing... ${syncStatus.total_processed} candidates processed`
                : `Sync complete. ${syncStatus.total_processed} imported, ${syncStatus.total_failed} failed`}
            </div>
          ) : null}

          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => saveDriveConfig.mutate({ driveFolderLink })}
              disabled={saveDriveConfig.isPending || !driveFolderLink}
            >
              {saveDriveConfig.isPending ? 'Saving...' : 'Save Drive Config'}
            </Button>
            <Button
              variant="outline"
              onClick={() => triggerSync.mutate()}
              disabled={triggerSync.isPending || !driveConfig?.drive_folder_link}
            >
              {triggerSync.isPending ? 'Starting...' : 'Sync Now'}
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-[Syne]">
            <Slack className="h-5 w-5 text-primary" />
            Slack Notifications
          </CardTitle>
          <CardDescription>Save a Slack webhook to receive ATS updates.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="slack-webhook">Slack Webhook URL</Label>
            <Input
              id="slack-webhook"
              placeholder="https://hooks.slack.com/services/..."
              value={slackWebhookUrl}
              onChange={(event) => setSlackWebhookUrl(event.target.value)}
            />
          </div>
          {profile?.slack_webhook_url ? (
            <div className="rounded-xl border border-success/30 bg-success/10 p-3 text-sm text-success">
              Connected
            </div>
          ) : null}
          <div className="grid gap-2 text-sm text-muted-foreground">
            <label><input type="checkbox" checked readOnly className="mr-2" />New candidate parsed from Drive</label>
            <label><input type="checkbox" checked readOnly className="mr-2" />Candidate approved by HR</label>
            <label><input type="checkbox" checked readOnly className="mr-2" />Interview scheduled</label>
            <label><input type="checkbox" checked readOnly className="mr-2" />Candidate selected</label>
          </div>
          <Button
            onClick={() => saveSlack.mutate(slackWebhookUrl)}
            disabled={saveSlack.isPending || !slackWebhookUrl}
          >
            {saveSlack.isPending ? 'Saving...' : 'Save Slack Webhook'}
          </Button>
        </CardContent>
      </Card>
    </div>
  )
}

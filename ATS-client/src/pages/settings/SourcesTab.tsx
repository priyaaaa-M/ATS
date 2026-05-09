import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2, Plus, RotateCcw, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { sourcesApi } from '../../api'
import { Badge } from '../../components/ui/badge'
import { Button } from '../../components/ui/button'
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '../../components/ui/card'
import { Input } from '../../components/ui/input'
import { Label } from '../../components/ui/label'

export function SourcesTab() {
  const queryClient = useQueryClient()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')

  const { data: sources = [], isLoading } = useQuery({
    queryKey: ['sources'],
    queryFn: () => sourcesApi.list(),
  })

  const createMutation = useMutation({
    mutationFn: () => sourcesApi.create({ name, description }),
    onSuccess: () => {
      setName('')
      setDescription('')
      toast.success('Source saved')
      void queryClient.invalidateQueries({ queryKey: ['sources'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not save source')
    },
  })

  const updateMutation = useMutation({
    mutationFn: ({ id, active }: { id: string; active: boolean }) =>
      sourcesApi.update(id, { active }),
    onSuccess: () => {
      void queryClient.invalidateQueries({ queryKey: ['sources'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not update source')
    },
  })

  const deactivateMutation = useMutation({
    mutationFn: sourcesApi.deactivate,
    onSuccess: () => {
      toast.success('Source disabled')
      void queryClient.invalidateQueries({ queryKey: ['sources'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Could not disable source')
    },
  })

  const activeSources = sources.filter((source) => source.active)
  const inactiveSources = sources.filter((source) => !source.active)

  return (
    <div className="mt-6 grid gap-6 lg:grid-cols-[minmax(0,420px)_1fr]">
      <Card>
        <CardHeader>
          <CardTitle>Candidate Sources</CardTitle>
          <CardDescription>
            Standardize where candidates come from before resumes enter the pipeline.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <Label>Source name</Label>
            <Input
              className="mt-1"
              value={name}
              onChange={(event) => setName(event.target.value)}
              placeholder="e.g. Campus Drive, Referral, LinkedIn"
            />
          </div>
          <div>
            <Label>Description</Label>
            <Input
              className="mt-1"
              value={description}
              onChange={(event) => setDescription(event.target.value)}
              placeholder="Optional context for HR"
            />
          </div>
          <Button
            className="w-full"
            onClick={() => createMutation.mutate()}
            disabled={!name.trim() || createMutation.isPending}
          >
            {createMutation.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Add Source
          </Button>
          <div className="rounded-lg border border-[var(--border)] bg-[var(--muted)]/30 p-3 text-xs leading-relaxed text-[var(--text-2)]">
            Manual upload now requires a role and one of these sources. This
            keeps filters, source analytics, and future dedupe reliable.
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Source Library</CardTitle>
          <CardDescription>
            Active sources appear in manual upload and future Drive validation.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="flex items-center gap-2 py-8 text-sm text-[var(--text-2)]">
              <Loader2 className="h-4 w-4 animate-spin" />
              Loading sources...
            </div>
          ) : (
            <div className="space-y-6">
              <div>
                <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--text-2)]">
                  Active
                </p>
                <div className="grid gap-3 md:grid-cols-2">
                  {activeSources.map((source) => (
                    <div
                      key={source.id}
                      className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 p-4"
                    >
                      <div className="flex items-start justify-between gap-3">
                        <div className="min-w-0">
                          <p className="truncate text-sm font-semibold text-[var(--text-1)]">
                            {source.name}
                          </p>
                          <p className="mt-1 text-xs text-[var(--text-2)]">
                            {source.description || source.normalizedName}
                          </p>
                        </div>
                        <Badge variant="outline">Active</Badge>
                      </div>
                      <Button
                        className="mt-4"
                        variant="outline"
                        size="sm"
                        onClick={() => deactivateMutation.mutate(source.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Disable
                      </Button>
                    </div>
                  ))}
                </div>
              </div>

              {inactiveSources.length > 0 && (
                <div>
                  <p className="mb-3 text-xs font-bold uppercase tracking-wide text-[var(--text-2)]">
                    Disabled
                  </p>
                  <div className="grid gap-3 md:grid-cols-2">
                    {inactiveSources.map((source) => (
                      <div
                        key={source.id}
                        className="rounded-xl border border-[var(--border)] bg-[var(--bg-card)] p-4 opacity-75"
                      >
                        <p className="text-sm font-semibold text-[var(--text-1)]">
                          {source.name}
                        </p>
                        <Button
                          className="mt-4"
                          variant="outline"
                          size="sm"
                          onClick={() => updateMutation.mutate({ id: source.id, active: true })}
                        >
                          <RotateCcw className="h-3.5 w-3.5" />
                          Restore
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}

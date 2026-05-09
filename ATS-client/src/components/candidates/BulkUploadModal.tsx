import React, { useRef, useState } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AlertTriangle, CheckCircle2, Eye, FileText, Loader2, Upload, X } from 'lucide-react'
import { toast } from 'sonner'
import { sourcesApi } from '../../api'
import { cn } from '../../lib/utils'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Input } from '../ui/input'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'

interface Role {
  id: string
  name: string
}

interface BulkUploadModalProps {
  open: boolean
  onClose: () => void
  roles: Role[]
}

type PreviewRow = {
  filename: string
  candidateName: string
  email: string | null
  phone: string | null
  role: string
  sourceName: string
  campaignName: string | null
  atsScore: number
  duplicate: boolean
  duplicateCandidateId: string | null
  parseStatus: 'ok' | 'weak'
}

type PreviewResponse = {
  total: number
  importable: number
  duplicates: number
  weakParses: number
  rows: PreviewRow[]
}

type ImportStep = 'files' | 'preview' | 'done'

export function BulkUploadModal({ open, onClose, roles }: BulkUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [role, setRole] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [campaignName, setCampaignName] = useState('')
  const [step, setStep] = useState<ImportStep>('files')
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [selectedFilenames, setSelectedFilenames] = useState<Set<string>>(new Set())
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<{ successful: number; duplicates: number; failed: number } | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: () => sourcesApi.list(),
    enabled: open,
    staleTime: 60_000,
  })
  const activeSources = sources.filter((source) => source.active)

  const reset = () => {
    setFiles([])
    setRole('')
    setSourceName('')
    setCampaignName('')
    setStep('files')
    setPreview(null)
    setSelectedFilenames(new Set())
    setIsPreviewing(false)
    setIsImporting(false)
    setProgress(0)
    setDragOver(false)
    setResult(null)
  }

  const close = () => {
    if (isPreviewing || isImporting) return
    onClose()
    window.setTimeout(reset, 150)
  }

  const addFiles = (incoming: File[]) => {
    if (incoming.length === 0) return
    setFiles((current) => {
      const byName = new Map(current.map((file) => [file.name, file]))
      incoming.forEach((file) => byName.set(file.name, file))
      return Array.from(byName.values()).slice(0, 50)
    })
    setPreview(null)
    setSelectedFilenames(new Set())
    setStep('files')
  }

  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    addFiles(Array.from(event.target.files || []))
    if (event.target) event.target.value = ''
  }

  const validateContext = () => {
    if (!role) {
      toast.error('Select a role before previewing resumes')
      return false
    }
    if (!sourceName) {
      toast.error('Select a candidate source before previewing resumes')
      return false
    }
    if (files.length === 0) {
      toast.error('Add at least one resume')
      return false
    }
    return true
  }

  const buildFormData = (targetFiles: File[]) => {
    const formData = new FormData()
    targetFiles.forEach((file) => formData.append('resumes', file))
    formData.append('role', role)
    formData.append('sourceName', sourceName)
    if (campaignName.trim()) formData.append('campaignName', campaignName.trim())
    return formData
  }

  const handlePreview = async () => {
    if (!validateContext()) return
    setIsPreviewing(true)
    try {
      const response = await axios.post<PreviewResponse>('/api/upload/preview', buildFormData(files), {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000,
      })
      setPreview(response.data)
      setSelectedFilenames(
        new Set(
          response.data.rows
            .filter((row) => !row.duplicate && row.parseStatus !== 'weak')
            .map((row) => row.filename),
        ),
      )
      setStep('preview')
      toast.success(`Preview ready: ${response.data.importable} importable resumes`)
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Preview failed')
    } finally {
      setIsPreviewing(false)
    }
  }

  const toggleFilename = (filename: string) => {
    setSelectedFilenames((current) => {
      const next = new Set(current)
      if (next.has(filename)) next.delete(filename)
      else next.add(filename)
      return next
    })
  }

  const handleConfirmImport = async () => {
    if (!preview || selectedFilenames.size === 0) {
      toast.error('Select at least one resume to import')
      return
    }

    const approvedFiles = files.filter((file) => selectedFilenames.has(file.name))
    setIsImporting(true)
    setProgress(5)
    const progressInterval = window.setInterval(() => {
      setProgress((current) => Math.min(current + (current < 70 ? 5 : 1), 92))
    }, 500)

    try {
      const formData = buildFormData(approvedFiles)
      formData.append('approvedFilenames', JSON.stringify(Array.from(selectedFilenames)))
      const response = await axios.post<{ successful: number; failed?: number; duplicates?: number }>(
        '/api/upload/bulk',
        formData,
        {
          headers: { 'Content-Type': 'multipart/form-data' },
          timeout: 180000,
        },
      )

      window.clearInterval(progressInterval)
      setProgress(100)
      setResult({
        successful: response.data.successful,
        duplicates: response.data.duplicates || 0,
        failed: response.data.failed || 0,
      })
      setStep('done')
      void queryClient.invalidateQueries({ queryKey: ['candidates'] })
      void queryClient.invalidateQueries({ queryKey: ['import-batches'] })
      void queryClient.invalidateQueries({ queryKey: ['dashboard-actions'] })
      toast.success('Import completed')
    } catch (err: any) {
      window.clearInterval(progressInterval)
      setProgress(0)
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  const selectedCount = selectedFilenames.size

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className="sm:max-w-[820px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Resumes</DialogTitle>
          <DialogDescription>
            Add context, preview parsed candidates, then confirm what enters the pipeline.
          </DialogDescription>
        </DialogHeader>

        <div className="grid grid-cols-3 gap-2 rounded-xl border border-border bg-muted/20 p-1 text-xs font-medium">
          {[
            ['files', '1. Context & Files'],
            ['preview', '2. Preview'],
            ['done', '3. Results'],
          ].map(([key, label]) => (
            <div
              key={key}
              className={cn(
                'rounded-lg px-3 py-2 text-center',
                step === key ? 'bg-primary text-white' : 'text-muted-foreground',
              )}
            >
              {label}
            </div>
          ))}
        </div>

        <div className="max-h-[68vh] overflow-y-auto pr-1">
          {step === 'files' && (
            <div className="space-y-6 py-4">
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-sm font-semibold text-foreground">Import context</p>
                <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
                  Applied to every resume in this batch.
                </p>
                <div className="mt-4 grid gap-4 md:grid-cols-2">
                  <div className="space-y-1.5">
                    <Label>Role <span className="text-destructive">*</span></Label>
                    <Select value={role} onValueChange={setRole}>
                      <SelectTrigger>
                        <SelectValue placeholder={roles.length ? 'Select role...' : 'No roles available'} />
                      </SelectTrigger>
                      <SelectContent>
                        {roles.map((item) => (
                          <SelectItem key={item.id} value={item.name}>
                            {item.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-1.5">
                    <Label>Source <span className="text-destructive">*</span></Label>
                    <Select value={sourceName} onValueChange={setSourceName}>
                      <SelectTrigger>
                        <SelectValue placeholder={activeSources.length ? 'Select source...' : 'No sources available'} />
                      </SelectTrigger>
                      <SelectContent>
                        {activeSources.map((source) => (
                          <SelectItem key={source.id} value={source.name}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="mt-4 space-y-1.5">
                  <Label>Campaign / Batch name</Label>
                  <Input
                    value={campaignName}
                    onChange={(event) => setCampaignName(event.target.value)}
                    placeholder="e.g. IIT Delhi 2026, January referral drive"
                  />
                </div>
              </div>

              <div
                onDragOver={(event) => {
                  event.preventDefault()
                  setDragOver(true)
                }}
                onDragLeave={() => setDragOver(false)}
                onDrop={(event) => {
                  event.preventDefault()
                  setDragOver(false)
                  addFiles(Array.from(event.dataTransfer.files))
                }}
                onClick={() => fileInputRef.current?.click()}
                className={cn(
                  'cursor-pointer rounded-xl border-2 border-dashed p-9 text-center transition-all',
                  dragOver ? 'scale-[0.99] border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                )}
              >
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Upload className="h-6 w-6 text-primary" />
                </div>
                <p className="text-sm font-semibold text-foreground">Click to select or drag and drop</p>
                <p className="mt-2 text-xs text-muted-foreground">PDF, DOCX, or TXT · up to 50 files</p>
                <input
                  ref={fileInputRef}
                  type="file"
                  multiple
                  accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
                  className="hidden"
                  onChange={handleFileChange}
                />
              </div>

              {files.length > 0 && (
                <div className="max-h-44 space-y-1.5 overflow-y-auto rounded-lg border border-border p-2">
                  {files.map((file) => (
                    <div key={file.name} className="flex items-center gap-3 rounded-lg bg-muted/50 px-3 py-2">
                      <FileText className="h-4 w-4 flex-shrink-0 text-muted-foreground" />
                      <span className="flex-1 truncate text-sm">{file.name}</span>
                      <span className="text-xs text-muted-foreground">{(file.size / 1024 / 1024).toFixed(1)}MB</span>
                      <button
                        onClick={(event) => {
                          event.stopPropagation()
                          setFiles((current) => current.filter((item) => item.name !== file.name))
                        }}
                        className="text-muted-foreground transition-colors hover:text-destructive"
                      >
                        <X className="h-3.5 w-3.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {step === 'preview' && preview && (
            <div className="space-y-4 py-4">
              <div className="grid gap-3 md:grid-cols-4">
                <div className="rounded-xl border border-border bg-muted/20 p-3">
                  <p className="text-xs text-muted-foreground">Total</p>
                  <p className="text-2xl font-bold">{preview.total}</p>
                </div>
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3">
                  <p className="text-xs text-green-400">Selected</p>
                  <p className="text-2xl font-bold text-green-400">{selectedCount}</p>
                </div>
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
                  <p className="text-xs text-yellow-400">Duplicates</p>
                  <p className="text-2xl font-bold text-yellow-400">{preview.duplicates}</p>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-xs text-red-400">Weak parses</p>
                  <p className="text-2xl font-bold text-red-400">{preview.weakParses}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-[44px_1.6fr_1.3fr_90px_110px] gap-3 border-b border-border bg-muted/40 px-3 py-2 text-xs font-semibold text-muted-foreground">
                  <span />
                  <span>Candidate</span>
                  <span>Email</span>
                  <span>Score</span>
                  <span>Status</span>
                </div>
                <div className="max-h-80 overflow-y-auto">
                  {preview.rows.map((row) => {
                    const disabled = row.duplicate || row.parseStatus === 'weak'
                    return (
                      <label
                        key={row.filename}
                        className={cn(
                          'grid grid-cols-[44px_1.6fr_1.3fr_90px_110px] gap-3 border-b border-border px-3 py-3 text-sm last:border-0',
                          disabled ? 'bg-muted/20 text-muted-foreground' : 'cursor-pointer hover:bg-muted/30',
                        )}
                      >
                        <input
                          type="checkbox"
                          checked={selectedFilenames.has(row.filename)}
                          disabled={disabled}
                          onChange={() => toggleFilename(row.filename)}
                          className="mt-1"
                        />
                        <span className="min-w-0">
                          <span className="block truncate font-medium">{row.candidateName}</span>
                          <span className="block truncate text-xs text-muted-foreground">{row.filename}</span>
                        </span>
                        <span className="truncate">{row.email || 'No email found'}</span>
                        <span>{row.atsScore}%</span>
                        <span>
                          {row.duplicate ? (
                            <Badge variant="outline" className="border-yellow-500/30 text-yellow-400">Duplicate</Badge>
                          ) : row.parseStatus === 'weak' ? (
                            <Badge variant="outline" className="border-red-500/30 text-red-400">Weak</Badge>
                          ) : (
                            <Badge variant="outline" className="border-green-500/30 text-green-400">Ready</Badge>
                          )}
                        </span>
                      </label>
                    )
                  })}
                </div>
              </div>

              {isImporting && (
                <div className="space-y-3 rounded-xl border border-border bg-muted/30 p-4">
                  <div className="flex items-center justify-between text-xs">
                    <span className="flex items-center gap-2 font-medium">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      Creating selected candidates...
                    </span>
                    <span className="font-bold text-primary">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
            </div>
          )}

          {step === 'done' && (
            <div className="py-10 text-center">
              <CheckCircle2 className="mx-auto mb-4 h-10 w-10 text-green-400" />
              <p className="text-lg font-semibold text-foreground">Import complete</p>
              <p className="mt-2 text-sm text-muted-foreground">
                {result?.successful || 0} created · {result?.duplicates || 0} duplicates · {result?.failed || 0} failed
              </p>
              {result?.failed ? (
                <p className="mx-auto mt-4 flex max-w-md items-center justify-center gap-2 rounded-lg border border-yellow-500/30 bg-yellow-500/10 px-3 py-2 text-xs text-yellow-400">
                  <AlertTriangle className="h-4 w-4" />
                  Some files failed. Check Recent Imports for batch details.
                </p>
              ) : null}
            </div>
          )}
        </div>

        <DialogFooter>
          {step === 'files' && (
            <>
              <Button variant="outline" onClick={close} disabled={isPreviewing}>Cancel</Button>
              <Button onClick={handlePreview} disabled={files.length === 0 || !role || !sourceName || isPreviewing}>
                {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin" /> : <Eye className="h-4 w-4" />}
                Preview {files.length || ''} Resume{files.length === 1 ? '' : 's'}
              </Button>
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('files')} disabled={isImporting}>Back</Button>
              <Button onClick={handleConfirmImport} disabled={selectedCount === 0 || isImporting}>
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
                Import {selectedCount} Selected
              </Button>
            </>
          )}
          {step === 'done' && (
            <Button onClick={close}>Done</Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

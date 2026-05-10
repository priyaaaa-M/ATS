import React, { useRef, useState, useMemo } from 'react'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import axios from 'axios'
import { AlertTriangle, CheckCircle2, Eye, FileText, Loader2, Upload, X, UserPlus, Files } from 'lucide-react'
import { toast } from 'sonner'
import { sourcesApi, rolesApi } from '../../api'
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../ui/tabs"

interface Role {
  id: string
  name: string
}

interface AddCandidateModalProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

type PreviewRow = {
  filename: string
  candidateName: string
  email: string | null
  phone: string | null
  role: string
  sourceName: string
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

type ImportStep = 'setup' | 'preview' | 'done'

export function AddCandidateModal({ open, onOpenChange }: AddCandidateModalProps) {
  const queryClient = useQueryClient()
  
  // Queries
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list, staleTime: 60_000 })
  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: () => sourcesApi.list(),
    enabled: open,
    staleTime: 60_000,
  })
  const activeSources = sources.filter((source) => source.active)

  // State
  const [mode, setMode] = useState<'bulk' | 'single'>('bulk')
  const [step, setStep] = useState<ImportStep>('setup')
  
  // Common fields
  const [role, setRole] = useState('')
  const [sourceName, setSourceName] = useState('')
  const [campaignName, setCampaignName] = useState('')

  // Single mode state
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [singleFile, setSingleFile] = useState<File | null>(null)
  const [isCreatingSingle, setIsCreatingSingle] = useState(false)

  // Bulk mode state
  const [files, setFiles] = useState<File[]>([])
  const [preview, setPreview] = useState<PreviewResponse | null>(null)
  const [selectedFilenames, setSelectedFilenames] = useState<Set<string>>(new Set())
  const [isPreviewing, setIsPreviewing] = useState(false)
  const [isImporting, setIsImporting] = useState(false)
  const [progress, setProgress] = useState(0)
  const [dragOver, setDragOver] = useState(false)
  const [result, setResult] = useState<{ successful: number; duplicates: number; failed: number } | null>(null)
  
  // Quick role creation state
  const [isCreatingRole, setIsCreatingRole] = useState(false)
  const [newRoleName, setNewRoleName] = useState('')
  const [showRoleInput, setShowRoleInput] = useState(false)
  
  const fileInputRef = useRef<HTMLInputElement>(null)
  const bulkInputRef = useRef<HTMLInputElement>(null)

  const reset = () => {
    setStep('setup')
    setMode('single')
    setRole('')
    setSourceName('')
    setCampaignName('')
    setName('')
    setEmail('')
    setPhone('')
    setSingleFile(null)
    setFiles([])
    setPreview(null)
    setSelectedFilenames(new Set())
    setIsPreviewing(false)
    setIsImporting(false)
    setIsCreatingSingle(false)
    setProgress(0)
    setDragOver(false)
    setResult(null)
  }

  const handleCreateRole = async () => {
    if (!newRoleName.trim()) return
    setIsCreatingRole(true)
    try {
      const response = await rolesApi.create(newRoleName)
      toast.success('Role created')
      setNewRoleName('')
      setShowRoleInput(false)
      await queryClient.invalidateQueries({ queryKey: ['roles'] })
      setRole(response.name) // Select the newly created role
    } catch (err: any) {
      toast.error(err.response?.data?.message || 'Could not create role')
    } finally {
      setIsCreatingRole(false)
    }
  }

  const close = () => {
    if (isPreviewing || isImporting || isCreatingSingle) return
    onOpenChange(false)
    window.setTimeout(reset, 200)
  }

  const handleSingleCreate = async () => {
    if (!name || !email || !role || !sourceName || !singleFile) {
      toast.error('Please fill all required fields and upload a resume')
      return
    }

    setIsCreatingSingle(true)
    try {
      const formData = new FormData()
      formData.append('name', name)
      formData.append('email', email)
      formData.append('phone', phone)
      formData.append('role', role)
      formData.append('sourceName', sourceName)
      formData.append('resume', singleFile)
      
      await axios.post('/api/candidates', formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      })

      toast.success('Candidate created successfully')
      void queryClient.invalidateQueries({ queryKey: ['candidates'] })
      onOpenChange(false)
      window.setTimeout(reset, 200)
    } catch (err: any) {
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Failed to create candidate')
    } finally {
      setIsCreatingSingle(false)
    }
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
  }

  const handlePreview = async () => {
    if (!role || !sourceName || files.length === 0) {
      toast.error('Select role, source, and add at least one resume')
      return
    }
    
    setIsPreviewing(true)
    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('resumes', file))
      formData.append('role', role)
      formData.append('sourceName', sourceName)
      if (campaignName.trim()) formData.append('campaignName', campaignName.trim())

      const response = await axios.post<PreviewResponse>('/api/upload/preview', formData, {
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

  const handleConfirmImport = async () => {
    if (!preview || selectedFilenames.size === 0) return
    
    const approvedFiles = files.filter((file) => selectedFilenames.has(file.name))
    setIsImporting(true)
    setProgress(5)
    
    const progressInterval = window.setInterval(() => {
      setProgress((current) => Math.min(current + (current < 70 ? 5 : 1), 92))
    }, 500)

    try {
      const formData = new FormData()
      approvedFiles.forEach((file) => formData.append('resumes', file))
      formData.append('role', role)
      formData.append('sourceName', sourceName)
      if (campaignName.trim()) formData.append('campaignName', campaignName.trim())
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
      toast.success('Import completed')
    } catch (err: any) {
      window.clearInterval(progressInterval)
      setProgress(0)
      toast.error(err.response?.data?.message || err.response?.data?.error || 'Import failed')
    } finally {
      setIsImporting(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={close}>
      <DialogContent className={cn("sm:max-w-[640px] transition-all duration-300", step === 'preview' && "sm:max-w-[820px]")}>
        <DialogHeader>
          <DialogTitle>{step === 'done' ? 'Import Complete' : 'Add Candidate'}</DialogTitle>
          <DialogDescription>
            {step === 'setup' && 'Create a single candidate or upload resumes in bulk.'}
            {step === 'preview' && 'Review parsed details and select which candidates to import.'}
          </DialogDescription>
        </DialogHeader>

        {step === 'setup' && (
          <div className="space-y-6 py-2">
            <Tabs value={mode} onValueChange={(v) => setMode(v as 'single' | 'bulk')} className="w-full">
              <TabsList className="grid w-full grid-cols-2 h-11 p-1 bg-secondary rounded-xl">
                <TabsTrigger value="single" className="rounded-lg gap-2">
                  <UserPlus className="h-4 w-4" />
                  Single Entry
                </TabsTrigger>
                <TabsTrigger value="bulk" className="rounded-lg gap-2">
                  <Files className="h-4 w-4" />
                  Bulk Upload
                </TabsTrigger>
              </TabsList>

              <div className="mt-6 space-y-5">
                {/* Context Fields */}
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Select Role</Label>
                      <button 
                        onClick={() => setShowRoleInput(!showRoleInput)}
                        className="text-[10px] font-bold text-brand hover:underline"
                      >
                        {showRoleInput ? 'Cancel' : '+ Add New Role'}
                      </button>
                    </div>
                    
                    {showRoleInput ? (
                      <div className="flex gap-2">
                        <Input 
                          value={newRoleName}
                          onChange={(e) => setNewRoleName(e.target.value)}
                          placeholder="Role title (e.g. Senior Backend)"
                          className="h-10 rounded-xl"
                        />
                        <Button 
                          size="sm" 
                          onClick={handleCreateRole} 
                          disabled={isCreatingRole || !newRoleName.trim()}
                          className="rounded-xl px-4"
                        >
                          {isCreatingRole ? <Loader2 className="h-3 w-3 animate-spin" /> : 'Add'}
                        </Button>
                      </div>
                    ) : (
                      <Select value={role} onValueChange={setRole}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select role..." />
                        </SelectTrigger>
                        <SelectContent>
                          {roles.map((r) => (
                            <SelectItem key={r.id} value={r.name}>{r.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    )}
                  </div>
                </div>

                <TabsContent value="single" className="space-y-4 m-0">
                  <div className="space-y-4 rounded-2xl border border-border bg-muted p-5">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source</Label>
                      <Select value={sourceName} onValueChange={setSourceName}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select source..." />
                        </SelectTrigger>
                        <SelectContent>
                          {activeSources.map((s) => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Full Name</Label>
                        <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g. John Doe" className="h-11 rounded-xl" />
                      </div>
                      <div className="space-y-2">
                        <Label>Email Address</Label>
                        <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="john@example.com" className="h-11 rounded-xl" />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Phone (Optional)</Label>
                      <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="+91 98765 43210" className="h-11 rounded-xl" />
                    </div>
                    <div className="space-y-2 pt-2">
                      <Label>Resume PDF</Label>
                      <div 
                        onClick={() => fileInputRef.current?.click()}
                        className={cn(
                          "cursor-pointer flex items-center gap-3 rounded-xl border-2 border-dashed p-4 transition-all hover:bg-secondary",
                          singleFile ? "border-primary/50 bg-primary/5" : "border-border"
                        )}
                      >
                        <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary/10">
                          <Upload className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{singleFile ? singleFile.name : 'Select resume file'}</p>
                          <p className="text-xs text-muted-foreground">{singleFile ? `${(singleFile.size/1024/1024).toFixed(1)}MB` : 'PDF preferred'}</p>
                        </div>
                        {singleFile && <X className="h-4 w-4 text-muted-foreground hover:text-destructive" onClick={(e) => { e.stopPropagation(); setSingleFile(null); }} />}
                      </div>
                      <input ref={fileInputRef} type="file" accept=".pdf,application/pdf" className="hidden" onChange={(e) => setSingleFile(e.target.files?.[0] || null)} />
                    </div>
                  </div>
                </TabsContent>

                <TabsContent value="bulk" className="space-y-4 m-0">
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Source (Optional)</Label>
                      <Select value={sourceName} onValueChange={setSourceName}>
                        <SelectTrigger className="h-11 rounded-xl">
                          <SelectValue placeholder="Select source..." />
                        </SelectTrigger>
                        <SelectContent>
                          {activeSources.map((s) => (
                            <SelectItem key={s.id} value={s.name}>{s.name}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    
                    <div
                      onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
                      onDragLeave={() => setDragOver(false)}
                      onDrop={(e) => { e.preventDefault(); setDragOver(false); addFiles(Array.from(e.dataTransfer.files)); }}
                      onClick={() => bulkInputRef.current?.click()}
                      className={cn(
                        'cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center transition-all',
                        dragOver ? 'border-primary bg-primary/5' : 'border-border hover:border-primary/50',
                      )}
                    >
                      <div className="mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                        <Upload className="h-6 w-6 text-primary" />
                      </div>
                      <p className="text-sm font-semibold">Drop resumes here or click to browse</p>
                      <p className="mt-1 text-xs text-muted-foreground">Up to 50 files (PDF, DOCX, TXT)</p>
                      <input ref={bulkInputRef} type="file" multiple accept=".pdf,.docx,.txt" className="hidden" onChange={(e) => addFiles(Array.from(e.target.files || []))} />
                    </div>

                    {files.length > 0 && (
                      <div className="max-h-40 space-y-1.5 overflow-y-auto rounded-xl border border-border p-2">
                        {files.map((f) => (
                          <div key={f.name} className="flex items-center gap-3 rounded-lg bg-secondary px-3 py-2 text-sm">
                            <FileText className="h-4 w-4 text-muted-foreground" />
                            <span className="flex-1 truncate">{f.name}</span>
                            <X className="h-4 w-4 cursor-pointer text-muted-foreground hover:text-destructive" onClick={() => setFiles(curr => curr.filter(x => x.name !== f.name))} />
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </TabsContent>
              </div>
            </Tabs>
          </div>
        )}

        {step === 'preview' && preview && (
          <div className="space-y-4 py-2">
             <div className="grid grid-cols-4 gap-3">
                <div className="rounded-xl border border-border bg-muted p-3">
                  <p className="text-[10px] uppercase font-bold text-muted-foreground">Total</p>
                  <p className="text-xl font-bold">{preview.total}</p>
                </div>
                <div className="rounded-xl border border-green-500/20 bg-green-500/10 p-3">
                  <p className="text-[10px] uppercase font-bold text-green-500">Selected</p>
                  <p className="text-xl font-bold text-green-500">{selectedFilenames.size}</p>
                </div>
                <div className="rounded-xl border border-yellow-500/20 bg-yellow-500/10 p-3">
                  <p className="text-[10px] uppercase font-bold text-yellow-600">Duplicates</p>
                  <p className="text-xl font-bold text-yellow-600">{preview.duplicates}</p>
                </div>
                <div className="rounded-xl border border-red-500/20 bg-red-500/10 p-3">
                  <p className="text-[10px] uppercase font-bold text-red-500">Weak</p>
                  <p className="text-xl font-bold text-red-500">{preview.weakParses}</p>
                </div>
              </div>

              <div className="overflow-hidden rounded-xl border border-border">
                <div className="grid grid-cols-[40px_1.5fr_1fr_60px_100px] gap-3 bg-muted px-3 py-2 text-[10px] font-bold uppercase text-muted-foreground">
                  <span />
                  <span>Candidate</span>
                  <span>Email</span>
                  <span>Score</span>
                  <span>Status</span>
                </div>
                <div className="max-h-[300px] overflow-y-auto">
                  {preview.rows.map((row) => {
                    const disabled = row.duplicate || row.parseStatus === 'weak'
                    return (
                      <label key={row.filename} className={cn(
                        "grid grid-cols-[40px_1.5fr_1fr_60px_100px] gap-3 items-center border-t border-border px-3 py-3 text-sm",
                        disabled ? "bg-muted opacity-60" : "cursor-pointer hover:bg-secondary"
                      )}>
                        <input type="checkbox" checked={selectedFilenames.has(row.filename)} disabled={disabled} onChange={() => {
                          setSelectedFilenames(curr => {
                            const next = new Set(curr)
                            if (next.has(row.filename)) next.delete(row.filename)
                            else next.add(row.filename)
                            return next
                          })
                        }} />
                        <span className="truncate font-medium">{row.candidateName}</span>
                        <span className="truncate text-xs">{row.email || '-'}</span>
                        <span className="font-semibold">{row.atsScore}%</span>
                        <Badge variant="outline" className={cn(
                          "text-[10px] py-0 h-5",
                          row.duplicate ? "border-yellow-500 text-yellow-600" :
                          row.parseStatus === 'weak' ? "border-red-500 text-red-600" :
                          "border-green-500 text-green-600"
                        )}>
                          {row.duplicate ? 'Duplicate' : row.parseStatus === 'weak' ? 'Weak' : 'Ready'}
                        </Badge>
                      </label>
                    )
                  })}
                </div>
              </div>

              {isImporting && (
                <div className="space-y-3 rounded-xl border border-border bg-muted p-4">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span className="flex items-center gap-2">
                      <Loader2 className="h-3.5 w-3.5 animate-spin text-primary" />
                      Creating candidates...
                    </span>
                    <span className="text-primary">{Math.round(progress)}%</span>
                  </div>
                  <div className="h-2 overflow-hidden rounded-full bg-muted">
                    <div className="h-full bg-primary transition-all duration-300" style={{ width: `${progress}%` }} />
                  </div>
                </div>
              )}
          </div>
        )}

        {step === 'done' && (
          <div className="py-12 text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-500/10">
              <CheckCircle2 className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-xl font-bold">Success!</p>
            <p className="mt-2 text-sm text-muted-foreground">
              {result?.successful || 0} candidates created successfully.
              {result?.duplicates ? ` ${result.duplicates} duplicates were skipped.` : ''}
            </p>
          </div>
        )}

        <DialogFooter className="gap-2 sm:gap-0">
          {step === 'setup' && (
            <>
              <Button variant="outline" onClick={close} className="rounded-xl">Cancel</Button>
              {mode === 'single' ? (
                <Button onClick={handleSingleCreate} disabled={isCreatingSingle} className="rounded-xl px-6">
                  {isCreatingSingle ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                  Create Candidate
                </Button>
              ) : (
                <Button onClick={handlePreview} disabled={isPreviewing || files.length === 0} className="rounded-xl px-6">
                   {isPreviewing ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Eye className="h-4 w-4 mr-2" />}
                   Preview {files.length} Resumes
                </Button>
              )}
            </>
          )}
          {step === 'preview' && (
            <>
              <Button variant="outline" onClick={() => setStep('setup')} disabled={isImporting} className="rounded-xl">Back</Button>
              <Button onClick={handleConfirmImport} disabled={isImporting || selectedFilenames.size === 0} className="rounded-xl px-6">
                {isImporting ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : null}
                Import {selectedFilenames.size} Selected
              </Button>
            </>
          )}
          {step === 'done' && <Button onClick={close} className="rounded-xl w-full sm:w-auto">Done</Button>}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

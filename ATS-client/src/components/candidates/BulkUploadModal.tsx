import React, { useState, useRef } from 'react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '../ui/dialog'
import { Button } from '../ui/button'
import { Label } from '../ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select'
import { Upload, FileText, X, Loader2, CheckCircle2 } from 'lucide-react'
import { cn } from '../../lib/utils'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'
import axios from 'axios'

interface Role {
  id: string
  name: string
}

interface BulkUploadModalProps {
  open: boolean
  onClose: () => void
  roles: Role[]
}

export function BulkUploadModal({ open, onClose, roles }: BulkUploadModalProps) {
  const [files, setFiles] = useState<File[]>([])
  const [role, setRole] = useState('')
  const [uploading, setUploading] = useState(false)
  const [progress, setProgress] = useState(0)
  const [done, setDone] = useState(false)
  const [dragOver, setDragOver] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const queryClient = useQueryClient()

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selected = Array.from(e.target.files || [])
    if (selected.length > 0) {
      setFiles((prev) => [...prev, ...selected].slice(0, 50))
    }
    if (e.target) e.target.value = ''
  }

  async function handleUpload() {
    if (files.length === 0) return
    setUploading(true)
    setProgress(5)
    
    // Animate progress bar to 90% while waiting for server
    const progressInterval = setInterval(() => {
      setProgress(prev => {
        if (prev >= 90) return prev
        const increment = prev < 40 ? 5 : prev < 70 ? 2 : 0.5
        return prev + increment
      })
    }, 500)

    try {
      const formData = new FormData()
      files.forEach((file) => formData.append('resumes', file))
      if (role) formData.append('role', role)

      await axios.post('/api/upload/bulk', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        timeout: 180000, 
      })

      clearInterval(progressInterval)
      setProgress(100)
      setDone(true)

      setTimeout(() => {
        queryClient.invalidateQueries({ queryKey: ['candidates'] })
        onClose()
        setFiles([])
        setDone(false)
        setProgress(0)
      }, 3000)
    } catch (err: any) {
      clearInterval(progressInterval)
      setProgress(0)
      toast.error(err.response?.data?.error || 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[560px]">
        <DialogHeader>
          <DialogTitle>Bulk Upload Resumes</DialogTitle>
          <DialogDescription>
            Upload up to 50 resumes at once. Each resume will be parsed automatically.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Role selector */}
          <div className="space-y-1.5">
            <Label>Assign to Role (optional)</Label>
            <Select value={role} onValueChange={setRole}>
              <SelectTrigger>
                <SelectValue placeholder="Select role..." />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="unassigned">General / Unassigned</SelectItem>
                {roles.map((r) => (
                  <SelectItem key={r.id} value={r.name}>
                    {r.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Drop zone */}
          <div
            onDragOver={(e) => {
              e.preventDefault()
              setDragOver(true)
            }}
            onDragLeave={() => setDragOver(false)}
            onDrop={(e) => {
              e.preventDefault()
              setDragOver(false)
              const dropped = Array.from(e.dataTransfer.files)
              setFiles((prev) => [...prev, ...dropped].slice(0, 50))
            }}
            onClick={() => fileInputRef.current?.click()}
            className={cn(
              'border-2 border-dashed rounded-xl p-10',
              'text-center cursor-pointer transition-all duration-200',
              dragOver ? 'border-primary bg-primary/5 scale-[0.99]' : 'border-border hover:border-primary/50',
            )}
          >
            <div className="bg-primary/10 w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-4">
              <Upload className="w-6 h-6 text-primary" />
            </div>
            <p className="text-sm font-semibold text-foreground">Click to select or drag and drop</p>
            <p className="text-xs text-muted-foreground mt-2">
              Select multiple resumes (PDF, DOCX, TXT)
            </p>
            <p className="text-[10px] text-muted-foreground/60 mt-1 uppercase tracking-wider font-bold">
              Up to 50 files · Max 10MB each
            </p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".pdf,.doc,.docx,.txt,application/pdf,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document"
              className="hidden"
              onChange={handleFileChange}
            />
          </div>

          {/* File list */}
          {files.length > 0 && !uploading && (
            <div className="max-h-48 overflow-y-auto space-y-1.5 rounded-lg border border-border p-2">
              {files.map((file, i) => (
                <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-muted/50">
                  <FileText className="w-4 h-4 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm flex-1 truncate">{file.name}</span>
                  <span className="text-xs text-muted-foreground flex-shrink-0">
                    {(file.size / 1024 / 1024).toFixed(1)}MB
                  </span>
                  <button
                    onClick={(e) => {
                      e.stopPropagation()
                      setFiles((prev) => prev.filter((_, idx) => idx !== i))
                    }}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Progress */}
          {uploading && (
            <div className="space-y-3 p-4 rounded-xl bg-muted/30 border border-border/50">
              <div className="flex justify-between items-center text-xs">
                <div className="flex items-center gap-2">
                  <Loader2 className="w-3 h-3 animate-spin text-primary" />
                  <span className="font-medium text-foreground">AI Parsing in progress...</span>
                </div>
                <span className="font-bold text-primary">{Math.round(progress)}%</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden border border-border/50">
                <div 
                  className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_8px_rgba(249,115,22,0.4)]"
                  style={{ width: `${progress}%` }}
                />
              </div>
              <p className="text-[10px] text-muted-foreground text-center">
                Processing {files.length} resumes. This usually takes 5-10 seconds per batch.
              </p>
            </div>
          )}

          {/* Success */}
          {done && (
            <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-4 text-center">
              <CheckCircle2 className="w-6 h-6 text-green-400 mx-auto mb-2" />
              <p className="text-sm font-medium text-green-400">Upload started!</p>
              <p className="text-xs text-muted-foreground mt-1">
                Resumes are being parsed in the background. Check the Candidates page in a moment.
              </p>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={uploading}>
            Cancel
          </Button>
          <Button onClick={handleUpload} disabled={files.length === 0 || uploading || done}>
            {uploading ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Processing...
              </>
            ) : (
              `Upload ${files.length} Resume${files.length !== 1 ? 's' : ''}`
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

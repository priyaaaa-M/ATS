'use client'

import { useState, useEffect } from 'react'
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle, 
  DialogDescription,
  DialogFooter 
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { 
  Folder, 
  FolderPlus, 
  ChevronRight, 
  FileUp, 
  X, 
  Loader2,
  CheckCircle2,
  Briefcase,
  Plus,
  RefreshCcw
} from 'lucide-react'
import { driveApi, DriveItem } from '@/lib/api/drive'
import { candidatesApi } from '@/lib/api/candidates'
import { cn } from '@/lib/utils'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'

interface NewCandidateDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
}

export function NewCandidateDialog({ open, onOpenChange }: NewCandidateDialogProps) {
  const [extracting, setExtracting] = useState(false)
  const [loading, setLoading] = useState(false)
  const [folders, setFolders] = useState<DriveItem[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | undefined>()
  const [selectedFolder, setSelectedFolder] = useState<DriveItem | null>(null)
  const [newFolderName, setNewFolderName] = useState('')
  const [isCreatingFolder, setIsCreatingFolder] = useState(false)
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    role: '',
    socials: { linkedin: '', github: '', portfolio: '' },
    parsedData: null as any,
  })
  const [file, setFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(null)
  const [zoom, setZoom] = useState(1)
  const [resetKey, setResetKey] = useState(0)

  useEffect(() => {
    if (open) {
      loadFolders()
      setSelectedFolder(null)
      setFile(null)
      setFileUrl(null)
      setFormData({ name: '', email: '', phone: '', role: '', socials: { linkedin: '', github: '', portfolio: '' }, parsedData: null })
    }
  }, [open, currentFolderId])

  useEffect(() => {
    return () => {
      if (fileUrl) {
        URL.revokeObjectURL(fileUrl)
      }
    }
  }, [fileUrl])

  const loadFolders = async () => {
    setLoading(true)
    try {
      const data = await driveApi.getContents(currentFolderId)
      // Capture the correct parent folder ID (e.g. Resume-ATS)
      if (data.folderId && !currentFolderId) {
        setCurrentFolderId(data.folderId)
      }
      setFolders(data.contents.filter(item => 
        item.isFolder && item.name.toLowerCase() !== 'rules'
      ))
    } catch (error) {
      toast.error('Failed to load folders')
    } finally {
      setLoading(false)
    }
  }

  const handleCreateFolder = async () => {
    if (!newFolderName.trim()) return
    setLoading(true)
    try {
      const newFolder = await (driveApi as any).createFolder(newFolderName, currentFolderId)
      setFolders(prev => [...prev, newFolder])
      setSelectedFolder(newFolder)
      setFormData(prev => ({ ...prev, role: newFolder.name }))
      setNewFolderName('')
      setIsCreatingFolder(false)
      toast.success(`Role "${newFolder.name}" created`)
    } catch (error) {
      toast.error('Failed to create role')
    } finally {
      setLoading(false)
    }
  }

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0] || null
    setFile(selectedFile)
    if (selectedFile) {
      // Create preview URL
      const url = URL.createObjectURL(selectedFile)
      setFileUrl(url)

      setExtracting(true)
      try {
        const payload = new FormData()
        payload.append('resume', selectedFile)
        const data = await candidatesApi.extract(payload)
        if (data) {
          setFormData(prev => ({
            ...prev,
            name: data.name || prev.name,
            email: data.email || prev.email,
            phone: data.phone || prev.phone,
            socials: {
              linkedin: data.socials?.linkedin || prev.socials.linkedin,
              github: data.socials?.github || prev.socials.github,
              portfolio: data.socials?.portfolio || prev.socials.portfolio,
            },
            parsedData: data.sections || prev.parsedData,
          }))
          toast.success('Information extracted from resume')
        }
      } catch (error) {
        toast.error('Could not extract info, please enter manually')
      } finally {
        setExtracting(false)
      }
    }
  }

  const handleSave = async () => {
    if (!file || !selectedFolder) {
      toast.error('Please select a folder and upload a resume')
      return
    }
    setLoading(true)
    try {
      const payload = new FormData()
      payload.append('name', formData.name)
      payload.append('email', formData.email)
      payload.append('phone', formData.phone)
      payload.append('role', formData.role)
      payload.append('folderId', selectedFolder.id)
      if (formData.socials) payload.append('socials', JSON.stringify(formData.socials))
      if (formData.parsedData) payload.append('parsedData', JSON.stringify(formData.parsedData))
      payload.append('resume', file)

      await (candidatesApi as any).create(payload)
      toast.success('Candidate added successfully')
      onOpenChange(false)
    } catch (error) {
      toast.error('Failed to add candidate')
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className={cn(
        "p-0 overflow-hidden rounded-[2rem] border-none shadow-2xl transition-all duration-500 ease-in-out",
        file ? "sm:max-w-[1100px] h-[85vh]" : "sm:max-w-[500px]"
      )}>
        {!file ? (
          <div className="p-12 flex flex-col items-center justify-center space-y-8">
            <DialogHeader className="text-center space-y-2">
              <DialogTitle className="text-3xl font-black tracking-tight">Add Candidate</DialogTitle>
              <DialogDescription className="text-muted-foreground font-medium">Upload a resume to get started.</DialogDescription>
            </DialogHeader>

            <div className="group relative w-full aspect-square max-w-[320px] flex flex-col items-center justify-center border-4 border-dashed border-secondary/20 rounded-[3rem] hover:border-primary/20 hover:bg-primary/5 transition-all cursor-pointer">
              <input 
                type="file" 
                className="absolute inset-0 opacity-0 cursor-pointer" 
                onChange={handleFileChange}
                accept=".pdf"
              />
              <div className="flex flex-col items-center gap-4">
                <div className="h-20 w-20 rounded-[2rem] bg-primary/10 flex items-center justify-center text-primary group-hover:scale-110 transition-transform">
                  <FileUp className="h-10 w-10" />
                </div>
                <div className="text-center">
                  <span className="block text-lg font-black uppercase tracking-wider">Drag resume here</span>
                  <span className="text-sm font-bold text-muted-foreground/60">PDF files only up to 10MB</span>
                </div>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex h-full overflow-hidden">
            {/* Left Column: PDF Preview */}
              <div 
                className="hidden md:block flex-1 bg-[#0a0a0a] border-r border-border/10 relative overflow-hidden group/pdf"
                onWheel={(e) => {
                  if (Math.abs(e.deltaY) > 0) {
                    setZoom(prev => Math.min(Math.max(0.5, prev + (e.deltaY * -0.001)), 3));
                  }
                }}
              >
                {/* PDF Controls */}
                <div className="absolute top-6 left-1/2 -translate-x-1/2 z-20 flex items-center gap-1.5 p-1.5 bg-black/60 backdrop-blur-2xl rounded-full border border-white/10 opacity-0 group-hover/pdf:opacity-100 transition-all duration-300">
                  <button 
                    onClick={() => setZoom(prev => Math.max(0.5, prev - 0.1))}
                    className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors"
                    title="Zoom Out"
                  >
                    <span className="text-xl font-medium">−</span>
                  </button>
                  <div className="px-2 text-[12px] font-black text-white/80 min-w-[45px] text-center tabular-nums">
                    {Math.round(zoom * 100)}%
                  </div>
                  <button 
                    onClick={() => setZoom(prev => Math.min(3, prev + 0.1))}
                    className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors"
                    title="Zoom In"
                  >
                    <span className="text-xl font-medium">+</span>
                  </button>
                  <div className="w-[1px] h-4 bg-white/10 mx-1" />
                  <button 
                    onClick={() => {
                      setZoom(1);
                      setResetKey(prev => prev + 1);
                    }}
                    className="h-9 w-9 rounded-full flex items-center justify-center hover:bg-white/10 text-white transition-colors"
                    title="Reset View"
                  >
                    <RefreshCcw className="h-4 w-4" />
                  </button>
                </div>

                <button 
                  onClick={() => { setFile(null); setFileUrl(null); }}
                  className="absolute top-6 left-6 z-20 h-11 w-11 rounded-full bg-black/60 backdrop-blur-md flex items-center justify-center border border-white/10 hover:bg-black/80 text-white transition-all shadow-xl"
                >
                  <X className="h-5 w-5" />
                </button>

                <div className="w-full h-full flex items-center justify-center cursor-grab active:cursor-grabbing">
                  {fileUrl && (
                    <motion.div
                      key={resetKey}
                      drag
                      dragConstraints={{ left: -1200, right: 1200, top: -1200, bottom: 1200 }}
                      dragElastic={0.05}
                      style={{ 
                        scale: zoom,
                      }}
                      className="w-full h-full max-w-[98%] max-h-[98%] aspect-[1/1.414] bg-white shadow-[0_20px_60px_rgba(0,0,0,0.6)] rounded-sm overflow-hidden flex items-center justify-center"
                    >
                      <iframe 
                        src={`${fileUrl}#toolbar=0&navpanes=0&scrollbar=0`} 
                        className="w-[105%] h-[105%] border-none pointer-events-none"
                        style={{ transform: 'scale(1.05)', transformOrigin: 'center' }}
                        title="Resume Preview"
                      />
                    </motion.div>
                  )}
                </div>
              </div>

            {/* Right Column: Form */}
            <div className="w-full md:w-[480px] flex flex-col bg-background">
              <div className="p-8 border-b border-border/5 bg-secondary/5">
                <DialogHeader className="flex items-center justify-between mb-1">
                  <DialogTitle className="text-2xl font-black tracking-tight">Candidate Details</DialogTitle>
                  {extracting && <Loader2 className="h-5 w-5 animate-spin text-primary" />}
                </DialogHeader>
                <DialogDescription className="text-[13px] font-medium text-muted-foreground">Verify and organize the candidate details.</DialogDescription>
              </div>

              <div className="flex-1 overflow-y-auto p-8 space-y-8 scrollbar-none">
                {/* Candidate Info */}
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Full Name</Label>
                    <div className="relative">
                      <Input 
                        placeholder="e.g. John Doe"
                        value={formData.name}
                        onChange={e => setFormData({...formData, name: e.target.value})}
                        className="h-12 rounded-2xl bg-secondary/10 border-transparent focus:bg-background transition-all font-bold px-4"
                      />
                      {extracting && !formData.name && <div className="absolute inset-0 bg-secondary/20 animate-pulse rounded-2xl" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Email</Label>
                      <div className="relative">
                        <Input 
                          placeholder="john@example.com"
                          value={formData.email}
                          onChange={e => setFormData({...formData, email: e.target.value})}
                          className="h-12 rounded-2xl bg-secondary/10 border-transparent focus:bg-background transition-all font-bold px-4"
                        />
                        {extracting && !formData.email && <div className="absolute inset-0 bg-secondary/20 animate-pulse rounded-2xl" />}
                      </div>
                    </div>
                    
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Phone</Label>
                      <div className="relative">
                        <Input 
                          placeholder="+1 234 567 8900"
                          value={formData.phone}
                          onChange={e => setFormData({...formData, phone: e.target.value})}
                          className="h-12 rounded-2xl bg-secondary/10 border-transparent focus:bg-background transition-all font-bold px-4"
                        />
                        {extracting && !formData.phone && <div className="absolute inset-0 bg-secondary/20 animate-pulse rounded-2xl" />}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">LinkedIn URL</Label>
                    <div className="relative">
                      <Input 
                        placeholder="linkedin.com/in/johndoe"
                        value={formData.socials.linkedin}
                        onChange={e => setFormData({...formData, socials: {...formData.socials, linkedin: e.target.value}})}
                        className="h-12 rounded-2xl bg-secondary/10 border-transparent focus:bg-background transition-all font-bold px-4"
                      />
                      {extracting && !formData.socials.linkedin && <div className="absolute inset-0 bg-secondary/20 animate-pulse rounded-2xl" />}
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">GitHub URL</Label>
                      <div className="relative">
                        <Input 
                          placeholder="github.com/johndoe"
                          value={formData.socials.github}
                          onChange={e => setFormData({...formData, socials: {...formData.socials, github: e.target.value}})}
                          className="h-12 rounded-2xl bg-secondary/10 border-transparent focus:bg-background transition-all font-bold px-4"
                        />
                        {extracting && !formData.socials.github && <div className="absolute inset-0 bg-secondary/20 animate-pulse rounded-2xl" />}
                      </div>
                    </div>
                    <div className="space-y-1.5">
                      <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Portfolio</Label>
                      <div className="relative">
                        <Input 
                          placeholder="johndoe.com"
                          value={formData.socials.portfolio}
                          onChange={e => setFormData({...formData, socials: {...formData.socials, portfolio: e.target.value}})}
                          className="h-12 rounded-2xl bg-secondary/10 border-transparent focus:bg-background transition-all font-bold px-4"
                        />
                        {extracting && !formData.socials.portfolio && <div className="absolute inset-0 bg-secondary/20 animate-pulse rounded-2xl" />}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Parsed Data Summary */}
                {formData.parsedData && (
                  <div className="space-y-2 pt-4 border-t border-border/5">
                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40 ml-1">Extracted Information</Label>
                    <div className="flex flex-wrap gap-2">
                      <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[12px] font-bold">
                        {formData.parsedData.experience?.length || 0} Experiences
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[12px] font-bold">
                        {formData.parsedData.education?.length || 0} Educations
                      </div>
                      <div className="px-3 py-1.5 rounded-lg bg-primary/10 text-primary text-[12px] font-bold">
                        {formData.parsedData.skills?.length || 0} Skills
                      </div>
                    </div>
                  </div>
                )}

                {/* Role Selection */}
                <div className="space-y-3 pt-4 border-t border-border/5">
                  <div className="flex items-center justify-between mb-1 px-1">
                    <Label className="text-[11px] font-black uppercase tracking-[0.2em] text-muted-foreground/40">Select Job Role</Label>
                    <button 
                      onClick={() => setIsCreatingFolder(true)}
                      className="text-[11px] font-black uppercase tracking-wider text-primary hover:opacity-80 transition-opacity"
                    >
                      + Add New Role
                    </button>
                  </div>

                  <div className="space-y-1.5">
                    {isCreatingFolder ? (
                      <div className="flex items-center gap-2 p-2 bg-primary/5 rounded-2xl border border-primary/20">
                        <Input 
                          autoFocus
                          placeholder="Role Name"
                          value={newFolderName}
                          onChange={e => setNewFolderName(e.target.value)}
                          className="h-10 bg-transparent border-none focus-visible:ring-0 font-bold"
                        />
                        <Button size="sm" onClick={handleCreateFolder} className="rounded-xl h-10 px-4">Create</Button>
                        <Button variant="ghost" size="sm" onClick={() => setIsCreatingFolder(false)} className="rounded-xl h-10 px-4">X</Button>
                      </div>
                    ) : (
                      <div className="grid grid-cols-2 gap-2">
                        {folders.map(folder => (
                          <button
                            key={folder.id}
                            onClick={() => {
                              setSelectedFolder(folder)
                              setFormData(prev => ({ ...prev, role: folder.name }))
                            }}
                            className={cn(
                              "flex items-center gap-2.5 px-4 py-3 rounded-2xl transition-all border text-left",
                              selectedFolder?.id === folder.id 
                                ? "bg-primary text-primary-foreground border-primary shadow-lg shadow-primary/20" 
                                : "bg-secondary/10 border-transparent hover:bg-secondary/20"
                            )}
                          >
                            <Briefcase className={cn("h-4 w-4", selectedFolder?.id === folder.id ? "text-primary-foreground" : "text-muted-foreground")} />
                            <span className="text-[13px] font-bold truncate">{folder.name}</span>
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="p-8 border-t border-border/5 bg-secondary/5 flex gap-3">
                <Button 
                  variant="outline" 
                  className="h-14 rounded-2xl px-6 font-bold flex-1"
                  onClick={() => { setFile(null); setFileUrl(null); }}
                >
                  Cancel
                </Button>
                <Button 
                  className="h-14 rounded-2xl px-10 font-black uppercase tracking-wider flex-[2] bg-primary shadow-xl shadow-primary/20 hover:scale-[1.02] transition-all"
                  onClick={handleSave}
                  disabled={loading || !selectedFolder || !formData.name || !formData.email}
                >
                  {loading ? <Loader2 className="h-5 w-5 animate-spin mr-2" /> : "Save Candidate"}
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

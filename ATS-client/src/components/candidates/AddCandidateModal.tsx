import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { candidatesApi, companyApi, rolesApi } from '../../api'
import { Button } from '../ui/button'
import { Dialog, DialogContent } from '../ui/dialog'
import { Input } from '../ui/input'
import { Textarea } from '../ui/textarea'

export function AddCandidateModal({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const qc = useQueryClient()
  const { data: roles = [] } = useQuery({ queryKey: ['roles'], queryFn: rolesApi.list, staleTime: 60_000 })
  const { data: driveConfig } = useQuery({ queryKey: ['drive-config'], queryFn: companyApi.getDriveConfig, staleTime: 60_000 })
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [phone, setPhone] = useState('')
  const [role, setRole] = useState('')
  const [file, setFile] = useState<File | null>(null)
  const [message, setMessage] = useState('')

  const folderId = useMemo(() => {
    const link = String(driveConfig?.driveFolderLink ?? '')
    return link.match(/\/folders\/([a-zA-Z0-9_-]+)/)?.[1] ?? ''
  }, [driveConfig?.driveFolderLink])

  const createMutation = useMutation({
    mutationFn: () => {
      const form = new FormData()
      form.append('name', name)
      form.append('email', email)
      form.append('phone', phone)
      form.append('role', role)
      form.append('folderId', folderId)
      if (file) form.append('resume', file)
      return candidatesApi.create(form)
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidates'] })
      setMessage('Candidate added successfully.')
      setName('')
      setEmail('')
      setPhone('')
      setRole('')
      setFile(null)
      onOpenChange(false)
    },
    onError: (error: unknown) => {
      const text = error && typeof error === 'object' && 'response' in error
        ? String((error as { response?: { data?: { message?: string; error?: string } } }).response?.data?.message ?? (error as { response?: { data?: { error?: string } } }).response?.data?.error ?? 'Failed to add candidate')
        : 'Failed to add candidate'
      setMessage(text)
    },
  })

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(560px,calc(100vw-32px))]">
        <h3 className="text-xl font-semibold text-[var(--text-1)]">Add Candidate</h3>
        <p className="mt-1 text-sm text-[var(--text-2)]">Upload a resume and create a candidate directly in the ATS.</p>
        <div className="mt-5 grid gap-4">
          <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="Candidate name" />
          <Input value={email} onChange={(e) => setEmail(e.target.value)} placeholder="Candidate email" />
          <Input value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="Phone number" />
          <div className="rounded-[12px] border bg-[var(--bg-card)] p-3">
            <p className="mb-2 text-xs font-semibold uppercase tracking-[0.08em] text-[var(--text-2)]">Role</p>
            <div className="flex flex-wrap gap-2">
              {roles.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setRole(item.name)}
                  className={`rounded-full px-3 py-2 text-sm ${role === item.name ? 'bg-[var(--brand)] text-white' : 'bg-[var(--bg-hover)] text-[var(--text-2)]'}`}
                >
                  {item.title}
                </button>
              ))}
            </div>
          </div>
          <div className="rounded-[14px] border border-dashed bg-[var(--bg-page)] p-4">
            <p className="text-sm font-medium text-[var(--text-1)]">Resume PDF</p>
            <p className="mt-1 text-sm text-[var(--text-2)]">Upload a PDF file. It will be sent to Drive and parsed by the backend.</p>
            <Input className="mt-3" type="file" accept=".pdf,application/pdf" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
          </div>
          {!folderId ? <Textarea readOnly value="No Drive folder is configured yet. Save a Google Drive folder link in Settings → Integrations before adding candidates manually." /> : null}
          {message ? <p className="text-sm text-[var(--brand)]">{message}</p> : null}
        </div>
        <div className="mt-6 flex justify-end gap-3">
          <Button variant="secondary" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button disabled={!name || !email || !role || !file || !folderId || createMutation.isPending} onClick={() => createMutation.mutate()}>
            {createMutation.isPending ? 'Adding...' : 'Add Candidate'}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
}

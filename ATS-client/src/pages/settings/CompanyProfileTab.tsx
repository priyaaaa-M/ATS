import { useEffect, useRef, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { companyApi } from '../../api'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../../components/ui/select'
import { Textarea } from '../../components/ui/textarea'
import { hexToHsl } from '../../lib/utils'

const defaultForm = {
  name: '',
  website: '',
  industry: '',
  size: '',
  description: '',
  brandColor: '#EC5B24',
  logoUrl: '',
}

export function CompanyProfileTab() {
  const queryClient = useQueryClient()
  const fileInputRef = useRef<HTMLInputElement | null>(null)
  const colorInputRef = useRef<HTMLInputElement | null>(null)
  const [form, setForm] = useState(defaultForm)

  const { data: profile, isLoading } = useQuery({
    queryKey: ['company-profile'],
    queryFn: () => companyApi.getProfile(),
  })

  useEffect(() => {
    if (profile) {
      setForm({
        name: profile.name || '',
        website: profile.website || '',
        industry: profile.industry || '',
        size: profile.size || '',
        description: profile.description || '',
        brandColor: profile.brandColor || '#EC5B24',
        logoUrl: profile.logoUrl || '',
      })
    }
  }, [profile])

  useEffect(() => {
    if (form.brandColor) {
      document.documentElement.style.setProperty('--brand', form.brandColor)
      document.documentElement.style.setProperty('--primary', hexToHsl(form.brandColor))
    }
  }, [form.brandColor])

  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    if (file.size > 2 * 1024 * 1024) {
      toast.error('Logo must be under 2MB')
      return
    }
    const reader = new FileReader()
    reader.onload = (ev) => {
      setForm((f) => ({ ...f, logoUrl: (ev.target?.result as string) || '' }))
    }
    reader.readAsDataURL(file)
  }

  const saveMutation = useMutation({
    mutationFn: () => companyApi.updateProfile(form),
    onSuccess: () => {
      toast.success('Company profile saved')
      queryClient.invalidateQueries({ queryKey: ['company-profile'] })
    },
    onError: (err: any) => {
      toast.error(err.response?.data?.message || 'Save failed')
    },
  })

  const fallbackInitial = (form.name || profile?.name || 'A').slice(0, 1).toUpperCase()

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Company Branding</CardTitle>
        <CardDescription>
          Your logo and brand colour appear across the entire interface.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex items-center gap-2 py-10 text-sm text-[var(--text-2)]">
            <Loader2 className="h-4 w-4 animate-spin" />
            Loading company profile...
          </div>
        ) : (
          <>
            <div className="grid gap-8 lg:grid-cols-2">
              <div>
                <Label>Company Logo</Label>
                <div
                  className="mt-2 rounded-xl border-2 border-dashed border-[var(--border)] p-8 text-center transition-colors hover:border-[var(--brand)] cursor-pointer"
                  onClick={() => fileInputRef.current?.click()}
                >
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt="Company logo"
                      className="w-16 h-16 rounded-full mx-auto object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-full bg-[var(--brand)] flex items-center justify-center text-2xl font-bold text-white mx-auto">
                      {fallbackInitial}
                    </div>
                  )}
                  <p className="mt-3 text-sm font-medium">Upload company logo</p>
                  <p className="text-xs text-[var(--text-2)] mt-1">
                    PNG or SVG · Max 2MB · 200×200px
                  </p>
                </div>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/png,image/svg+xml"
                  className="hidden"
                  onChange={handleLogoUpload}
                />
              </div>

              <div className="space-y-4">
                <div>
                  <Label>Brand Colour</Label>
                  <div className="flex flex-wrap items-center gap-3 mt-2">
                    <div
                      className="w-11 h-11 rounded-lg border-2 border-[var(--border)] cursor-pointer flex-shrink-0"
                      style={{ background: form.brandColor }}
                      onClick={() => colorInputRef.current?.click()}
                    />
                    <input
                      type="color"
                      ref={colorInputRef}
                      value={form.brandColor}
                      onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                      className="hidden"
                    />
                    <Input
                      value={form.brandColor}
                      onChange={(e) => setForm((f) => ({ ...f, brandColor: e.target.value }))}
                      className="font-mono w-32"
                      placeholder="#EC5B24"
                    />
                    <p className="text-xs text-[var(--text-2)] leading-relaxed">
                      Live preview updates
                      <br />
                      the entire interface
                    </p>
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Company Name</Label>
                    <Input
                      className="mt-1"
                      value={form.name}
                      onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                      placeholder="Your company name"
                    />
                  </div>
                  <div>
                    <Label>Website</Label>
                    <Input
                      className="mt-1"
                      value={form.website}
                      onChange={(e) => setForm((f) => ({ ...f, website: e.target.value }))}
                      placeholder="https://..."
                    />
                  </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div>
                    <Label>Industry</Label>
                    <Select
                      value={form.industry}
                      onValueChange={(v) => setForm((f) => ({ ...f, industry: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select industry" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="healthtech">Healthcare / Health Tech</SelectItem>
                        <SelectItem value="technology">Technology</SelectItem>
                        <SelectItem value="finance">Finance</SelectItem>
                        <SelectItem value="education">Education</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label>Company Size</Label>
                    <Select
                      value={form.size}
                      onValueChange={(v) => setForm((f) => ({ ...f, size: v }))}
                    >
                      <SelectTrigger className="mt-1">
                        <SelectValue placeholder="Select size" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1-10">1–10</SelectItem>
                        <SelectItem value="11-50">11–50</SelectItem>
                        <SelectItem value="51-200">51–200</SelectItem>
                        <SelectItem value="201+">201+</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div>
                  <Label>Description</Label>
                  <Textarea
                    className="mt-1"
                    value={form.description}
                    onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
                    placeholder="Describe what your company does..."
                    rows={4}
                  />
                </div>
              </div>
            </div>

            <div className="mt-6 pt-6 border-t border-[var(--border)]">
              <Button
                onClick={() => saveMutation.mutate()}
                disabled={saveMutation.isPending}
                className="bg-[var(--brand)] text-white hover:opacity-90"
              >
                {saveMutation.isPending ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  'Save Profile Changes'
                )}
              </Button>
            </div>
          </>
        )}
      </CardContent>
    </Card>
  )
}

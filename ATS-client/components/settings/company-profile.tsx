'use client'

import { useEffect, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Building2, Check, Palette, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Skeleton } from '@/components/ui/skeleton'
import { companyApi } from '@/lib/api'
import { useAuthStore } from '@/lib/store/auth-store'
import { cn, hexToHsl } from '@/lib/utils'

const presetColors = [
  { name: 'Teal', value: '#0D7377' },
  { name: 'Emerald', value: '#10B981' },
  { name: 'Coral', value: '#F97316' },
  { name: 'Amber', value: '#F59E0B' },
  { name: 'Cyan', value: '#06B6D4' },
  { name: 'Rose', value: '#F43F5E' },
]

export function CompanyProfile() {
  const queryClient = useQueryClient()
  const { updateCompany } = useAuthStore()
  const { data: profile, isLoading } = useQuery({
    queryKey: ['company-profile'],
    queryFn: companyApi.getProfile,
  })

  const [form, setForm] = useState({
    name: '',
    logoUrl: '',
    brandColor: '#0D7377',
    industry: '',
    size: '',
    description: '',
    website: '',
  })

  useEffect(() => {
    if (!profile) return
    setForm({
      name: profile.name || '',
      logoUrl: profile.logo_url || '',
      brandColor: profile.brand_color || '#0D7377',
      industry: profile.industry || '',
      size: profile.size || '',
      description: profile.description || '',
      website: profile.website || '',
    })
  }, [profile])

  const saveProfile = useMutation({
    mutationFn: companyApi.updateProfile,
    onSuccess: (company) => {
      updateCompany(company)
      queryClient.invalidateQueries({ queryKey: ['company-profile'] })
      toast.success('Profile saved')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Failed to save profile')
    },
  })

  const handleColorPreview = (hex: string) => {
    setForm((current) => ({ ...current, brandColor: hex }))
    document.documentElement.style.setProperty('--brand', hexToHsl(hex))
  }

  if (isLoading) {
    return <Skeleton className="h-[520px] w-full bg-surface-2" />
  }

  return (
    <div className="space-y-6">
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 font-[Syne] text-foreground">
            <Building2 className="h-5 w-5 text-primary" />
            Company Profile
          </CardTitle>
          <CardDescription>Update the brand and details used throughout the ATS.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="company-name">Company Name</Label>
              <Input
                id="company-name"
                value={form.name}
                onChange={(event) =>
                  setForm((current) => ({ ...current, name: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="website">Website</Label>
              <Input
                id="website"
                value={form.website}
                onChange={(event) =>
                  setForm((current) => ({ ...current, website: event.target.value }))
                }
                placeholder="https://company.com"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="industry">Industry</Label>
              <Input
                id="industry"
                value={form.industry}
                onChange={(event) =>
                  setForm((current) => ({ ...current, industry: event.target.value }))
                }
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="size">Company Size</Label>
              <Input
                id="size"
                value={form.size}
                onChange={(event) =>
                  setForm((current) => ({ ...current, size: event.target.value }))
                }
                placeholder="11-50"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="logo-url">Logo URL</Label>
            <div className="flex gap-3">
              <Input
                id="logo-url"
                value={form.logoUrl}
                onChange={(event) =>
                  setForm((current) => ({ ...current, logoUrl: event.target.value }))
                }
                placeholder="https://..."
              />
              <Button type="button" variant="outline">
                <Upload className="mr-2 h-4 w-4" />
                Use URL
              </Button>
            </div>
          </div>

          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Palette className="h-4 w-4 text-primary" />
              Brand Color
            </Label>
            <div className="flex flex-wrap gap-3">
              {presetColors.map((color) => (
                <button
                  key={color.value}
                  type="button"
                  title={color.name}
                  onClick={() => handleColorPreview(color.value)}
                  className={cn(
                    'flex h-10 w-10 items-center justify-center rounded-full ring-offset-2 transition-transform hover:scale-110',
                    form.brandColor === color.value && 'ring-2 ring-foreground'
                  )}
                  style={{ backgroundColor: color.value }}
                >
                  {form.brandColor === color.value ? (
                    <Check className="h-4 w-4 text-white" />
                  ) : null}
                </button>
              ))}
            </div>
            <div className="flex items-center gap-3">
              <input
                type="color"
                value={form.brandColor}
                onChange={(event) => handleColorPreview(event.target.value)}
                className="h-10 w-10 rounded-md border border-border bg-transparent"
              />
              <Input
                value={form.brandColor}
                onChange={(event) => {
                  const value = event.target.value
                  setForm((current) => ({ ...current, brandColor: value }))
                  if (/^#[0-9A-Fa-f]{6}$/.test(value)) {
                    handleColorPreview(value)
                  }
                }}
                className="w-36 font-mono"
              />
            </div>
          </div>

          <div className="rounded-xl border border-border bg-surface-2 p-4">
            <p className="mb-3 text-sm font-medium text-foreground">Live Preview</p>
            <div className="flex flex-wrap items-center gap-3">
              <Button style={{ backgroundColor: form.brandColor, color: '#fff' }}>
                Primary Action
              </Button>
              <span
                className="rounded-full px-3 py-1 text-xs font-medium text-white"
                style={{ backgroundColor: form.brandColor }}
              >
                Badge
              </span>
            </div>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={() =>
                saveProfile.mutate({
                  name: form.name,
                  logoUrl: form.logoUrl || undefined,
                  brandColor: form.brandColor,
                  industry: form.industry || undefined,
                  size: form.size || undefined,
                  description: form.description || undefined,
                  website: form.website || undefined,
                })
              }
              disabled={saveProfile.isPending}
            >
              {saveProfile.isPending ? 'Saving...' : 'Save Profile'}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

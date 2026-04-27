'use client'

import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Search, Filter, Grid, List, X } from 'lucide-react'
import { toast } from 'sonner'
import { AppShell } from '@/components/layout/app-shell'
import { CandidateCard } from '@/components/candidates/candidate-card'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import { Skeleton } from '@/components/ui/skeleton'
import { Checkbox } from '@/components/ui/checkbox'
import { Label } from '@/components/ui/label'
import { Slider } from '@/components/ui/slider'
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { candidatesApi } from '@/lib/api/candidates'
import type { Candidate, CandidateFilters } from '@/lib/types'
import { cn } from '@/lib/utils'

const roles = ['Backend Engineer', 'Frontend Engineer', 'DevOps Engineer', 'Full Stack']
const statuses = ['pending', 'hr_approved', 'scheduled', 'selected', 'rejected']

export default function CandidatesPage() {
  const queryClient = useQueryClient()
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'table'>('grid')
  const [selectedRoles, setSelectedRoles] = useState<string[]>([])
  const [selectedStatuses, setSelectedStatuses] = useState<string[]>([])
  const [atsRange, setAtsRange] = useState<[number, number]>([0, 100])

  const { data: candidates = [], isLoading, isError, refetch } = useQuery({
    queryKey: ['candidates'],
    queryFn: () => candidatesApi.list(),
  })

  const approveMutation = useMutation({
    mutationFn: candidatesApi.approve,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate approved')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Approval failed')
    },
  })

  const rejectMutation = useMutation({
    mutationFn: candidatesApi.reject,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      toast.success('Candidate rejected')
    },
    onError: (error: any) => {
      toast.error(error.response?.data?.message || 'Rejection failed')
    },
  })

  const filteredCandidates = useMemo(() => candidates.filter(c => {
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.role.toLowerCase().includes(searchQuery.toLowerCase())
    
    const matchesRole = selectedRoles.length === 0 || selectedRoles.includes(c.role)
    const matchesStatus = selectedStatuses.length === 0 || selectedStatuses.includes(c.status)
    const matchesAts = c.ats_score >= atsRange[0] && c.ats_score <= atsRange[1]
    
    return matchesSearch && matchesRole && matchesStatus && matchesAts
  }), [atsRange, candidates, searchQuery, selectedRoles, selectedStatuses])

  const clearFilters = () => {
    setSelectedRoles([])
    setSelectedStatuses([])
    setAtsRange([0, 100])
  }

  const hasActiveFilters = selectedRoles.length > 0 || selectedStatuses.length > 0 || atsRange[0] > 0 || atsRange[1] < 100

  const getRoleCounts = () => {
    return roles.reduce((acc, role) => {
      acc[role] = candidates.filter(c => c.role === role).length
      return acc
    }, {} as Record<string, number>)
  }

  const getStatusCounts = () => {
    return statuses.reduce((acc, status) => {
      acc[status] = candidates.filter(c => c.status === status).length
      return acc
    }, {} as Record<string, number>)
  }

  const roleCounts = getRoleCounts()
  const statusCounts = getStatusCounts()

  return (
    <AppShell>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="font-[Syne] text-2xl font-bold text-foreground flex items-center gap-3">
              Candidates
              <Badge className="bg-primary text-primary-foreground">
                {candidates.length}
              </Badge>
            </h1>
            <p className="text-muted-foreground">Manage and review all applicants</p>
          </div>

          <div className="flex items-center gap-3">
            <div className="relative flex-1 md:flex-none">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search candidates..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9 w-full md:w-64 bg-surface-2 border-border"
              />
            </div>
            
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="outline" className="border-border relative">
                  <Filter className="mr-2 h-4 w-4" />
                  Filters
                  {hasActiveFilters && (
                    <span className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-primary" />
                  )}
                </Button>
              </SheetTrigger>
              <SheetContent className="bg-surface border-border w-[320px]">
                <SheetHeader>
                  <div className="flex items-center justify-between">
                    <SheetTitle className="text-foreground">Filters</SheetTitle>
                    {hasActiveFilters && (
                      <Button variant="ghost" size="sm" onClick={clearFilters} className="text-primary">
                        Clear all
                      </Button>
                    )}
                  </div>
                </SheetHeader>
                
                <div className="mt-6 space-y-6">
                  {/* Role Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">Role</Label>
                    <div className="space-y-2">
                      {roles.map(role => (
                        <div key={role} className="flex items-center gap-2">
                          <Checkbox
                            id={`role-${role}`}
                            checked={selectedRoles.includes(role)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedRoles([...selectedRoles, role])
                              } else {
                                setSelectedRoles(selectedRoles.filter(r => r !== role))
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`role-${role}`} 
                            className="text-sm text-muted-foreground flex-1 cursor-pointer"
                          >
                            {role}
                          </Label>
                          <span className="text-xs text-muted-foreground">({roleCounts[role]})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Status Filter */}
                  <div className="space-y-3">
                    <Label className="text-sm font-medium text-foreground">Status</Label>
                    <div className="space-y-2">
                      {statuses.map(status => (
                        <div key={status} className="flex items-center gap-2">
                          <Checkbox
                            id={`status-${status}`}
                            checked={selectedStatuses.includes(status)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedStatuses([...selectedStatuses, status])
                              } else {
                                setSelectedStatuses(selectedStatuses.filter(s => s !== status))
                              }
                            }}
                          />
                          <Label 
                            htmlFor={`status-${status}`} 
                            className="text-sm text-muted-foreground flex-1 cursor-pointer capitalize"
                          >
                            {status.replace('_', ' ')}
                          </Label>
                          <span className="text-xs text-muted-foreground">({statusCounts[status]})</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* ATS Score Filter */}
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <Label className="text-sm font-medium text-foreground">ATS Score</Label>
                      <span className="text-xs text-muted-foreground">
                        {atsRange[0]} - {atsRange[1]}
                      </span>
                    </div>
                    <Slider
                      value={atsRange}
                      onValueChange={(value) => setAtsRange(value as [number, number])}
                      min={0}
                      max={100}
                      step={5}
                      className="py-4"
                    />
                  </div>
                </div>
              </SheetContent>
            </Sheet>
            
            <div className="hidden md:flex border border-border rounded-lg overflow-hidden">
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-none',
                  viewMode === 'grid' && 'bg-surface-2'
                )}
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                className={cn(
                  'rounded-none',
                  viewMode === 'table' && 'bg-surface-2'
                )}
                onClick={() => setViewMode('table')}
              >
                <List className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Active Filters Display */}
        {hasActiveFilters && (
          <div className="flex flex-wrap gap-2">
            {selectedRoles.map(role => (
              <Badge key={role} variant="secondary" className="gap-1 bg-surface-2">
                {role}
                <button onClick={() => setSelectedRoles(selectedRoles.filter(r => r !== role))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {selectedStatuses.map(status => (
              <Badge key={status} variant="secondary" className="gap-1 bg-surface-2 capitalize">
                {status.replace('_', ' ')}
                <button onClick={() => setSelectedStatuses(selectedStatuses.filter(s => s !== status))}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {(atsRange[0] > 0 || atsRange[1] < 100) && (
              <Badge variant="secondary" className="gap-1 bg-surface-2">
                ATS: {atsRange[0]}-{atsRange[1]}
                <button onClick={() => setAtsRange([0, 100])}>
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            )}
          </div>
        )}

        {/* Results Count */}
        <p className="text-sm text-muted-foreground">
          Showing {filteredCandidates.length} of {candidates.length} candidates
        </p>

        {/* Loading State */}
        {isLoading && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-64 bg-surface-2" />
            ))}
          </div>
        )}

        {!isLoading && isError && (
          <div className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm">
            Failed to load candidates.
            <Button variant="link" onClick={() => refetch()} className="px-2">
              Retry
            </Button>
          </div>
        )}

        {/* Candidates Grid */}
        {!isLoading && !isError && (
          <div className={cn(
            'grid gap-4',
            viewMode === 'grid' 
              ? 'grid-cols-1 md:grid-cols-2 lg:grid-cols-3' 
              : 'grid-cols-1'
          )}>
            {filteredCandidates.map((candidate) => (
              <CandidateCard
                key={candidate.id}
                candidate={candidate}
                onApprove={(id) => approveMutation.mutate(id)}
                onReject={(id) => rejectMutation.mutate(id)}
              />
            ))}
          </div>
        )}

        {/* Empty State */}
        {!isLoading && !isError && filteredCandidates.length === 0 && (
          <div className="text-center py-12">
            <p className="text-muted-foreground">No candidates found matching your criteria</p>
            {hasActiveFilters && (
              <Button variant="link" onClick={clearFilters} className="text-primary mt-2">
                Clear filters
              </Button>
            )}
          </div>
        )}
      </div>
    </AppShell>
  )
}

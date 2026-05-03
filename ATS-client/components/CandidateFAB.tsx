'use client'

import { AnimatePresence, motion } from 'framer-motion'
import {
  ArrowLeft,
  BadgeAlert,
  Briefcase,
  Check,
  Clock3,
  Mail,
  MessageSquare,
  Search,
  Users,
  X,
} from 'lucide-react'
import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { candidatesApi, rolesApi } from '@/lib/api'
import type { Candidate } from '@/lib/types'
import { cn, formatRelativeTime } from '@/lib/utils'

function scoreLabel(score: number) {
  if (score >= 75) return 'Strong'
  if (score >= 50) return 'Potential'
  return 'Weak'
}

function scoreTone(score: number) {
  if (score >= 75) return 'bg-success/15 text-success border-success/30'
  if (score >= 50) return 'bg-warning/15 text-warning border-warning/30'
  return 'bg-destructive/15 text-destructive border-destructive/30'
}

function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .map((part) => part[0])
    .join('')
    .slice(0, 2)
    .toUpperCase()
}

function scoreRing(score: number) {
  return {
    background: `conic-gradient(hsl(var(--brand)) ${score * 3.6}deg, hsl(var(--surface-2)) 0deg)`,
  }
}

export function CandidateFAB() {
  const queryClient = useQueryClient()
  const [open, setOpen] = useState(false)
  const [selectedCandidateId, setSelectedCandidateId] = useState<string | null>(null)
  const [roleFilter, setRoleFilter] = useState('all')
  const [search, setSearch] = useState('')
  const [sortKey, setSortKey] = useState<'score' | 'date' | 'name'>('score')
  const [noteText, setNoteText] = useState('')
  const [rejectReason, setRejectReason] = useState('Not a fit')

  const { data: inboxCandidates = [] } = useQuery({
    queryKey: ['candidates', { inboxStatus: 'inbox' }],
    queryFn: () => candidatesApi.list({ inboxStatus: 'inbox' }),
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['role-details'],
    queryFn: rolesApi.list,
  })

  const selectedCandidate = useMemo(
    () => inboxCandidates.find((candidate) => candidate.id === selectedCandidateId) || null,
    [inboxCandidates, selectedCandidateId]
  )

  const filteredCandidates = useMemo(() => {
    const roleSet = roleFilter === 'all' ? null : roleFilter
    return [...inboxCandidates]
      .filter((candidate) => {
        const haystack = `${candidate.name} ${candidate.email} ${candidate.role}`.toLowerCase()
        return haystack.includes(search.toLowerCase())
      })
      .filter((candidate) => (roleSet ? candidate.role === roleSet : true))
      .sort((a, b) => {
        if (sortKey === 'name') return a.name.localeCompare(b.name)
        if (sortKey === 'date') return new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
        return (b.match_score || b.ats_score || 0) - (a.match_score || a.ats_score || 0)
      })
  }, [inboxCandidates, roleFilter, search, sortKey])

  const moveToPipelineMutation = useMutation({
    mutationFn: candidatesApi.moveToPipeline,
    onSuccess: () => {
      toast.success('Candidate added to pipeline')
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      queryClient.invalidateQueries({ queryKey: ['role-details'] })
      setSelectedCandidateId(null)
    },
    onError: () => toast.error('Failed to move candidate to pipeline'),
  })

  const notInterestedMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason?: string }) =>
      candidatesApi.notInterested(id, reason),
    onSuccess: () => {
      toast.success('Candidate moved to rejected')
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      setSelectedCandidateId(null)
    },
    onError: () => toast.error('Failed to reject candidate'),
  })

  const addNoteMutation = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) =>
      candidatesApi.addNote(id, text),
    onSuccess: () => {
      toast.success('Note saved')
      queryClient.invalidateQueries({ queryKey: ['candidates'] })
      setNoteText('')
    },
  })

  const inboxCount = inboxCandidates.length

  const handleInterview = () => {
    if (!selectedCandidate) return
    moveToPipelineMutation.mutate(selectedCandidate.id)
  }

  const handleReject = () => {
    if (!selectedCandidate) return
    notInterestedMutation.mutate({ id: selectedCandidate.id, reason: rejectReason })
  }

  return (
    <div className="fixed bottom-6 left-[276px] z-50 hidden md:block">
      <div className="relative">
        <motion.button
          type="button"
          title={`Candidate Inbox (${inboxCount})`}
          whileHover={{ scale: 1.1 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setOpen((current) => !current)}
          className="relative flex h-14 w-14 items-center justify-center rounded-full bg-[hsl(var(--brand))] text-white shadow-2xl"
        >
          <Users className="h-6 w-6" />
          {inboxCount > 0 ? (
            <span className="absolute -right-1 -top-1 flex h-5 min-w-5 items-center justify-center rounded-full bg-destructive px-1 text-[10px] font-semibold text-white">
              {inboxCount}
            </span>
          ) : null}
        </motion.button>

        <AnimatePresence>
          {open ? (
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 20, scale: 0.95 }}
              transition={{ duration: 0.18 }}
              className="absolute bottom-16 left-0 w-[380px] max-h-[70vh] overflow-hidden rounded-2xl border border-border bg-surface shadow-2xl"
            >
              <div className="border-b border-border p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div>
                    <h3 className="font-[Syne] text-lg font-semibold">Candidate Inbox</h3>
                    <p className="text-xs text-muted-foreground">{inboxCount} waiting for review</p>
                  </div>
                  <Button variant="ghost" size="icon" onClick={() => setOpen(false)}>
                    <X className="h-4 w-4" />
                  </Button>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Select value={roleFilter} onValueChange={setRoleFilter}>
                    <SelectTrigger className="h-9 bg-surface-2">
                      <SelectValue placeholder="Role" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All roles</SelectItem>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.name}>
                          {role.title || role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>

                  <Select value={sortKey} onValueChange={(value) => setSortKey(value as any)}>
                    <SelectTrigger className="h-9 bg-surface-2">
                      <SelectValue placeholder="Sort" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="score">Score</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="name">Name</SelectItem>
                    </SelectContent>
                  </Select>

                  <div className="relative">
                    <Search className="absolute left-2 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-muted-foreground" />
                    <Input
                      value={search}
                      onChange={(event) => setSearch(event.target.value)}
                      className="h-9 pl-8 bg-surface-2"
                      placeholder="Search"
                    />
                  </div>
                </div>
              </div>

              <ScrollArea className="max-h-[calc(70vh-140px)]">
                <div className="p-3">
                  {!selectedCandidate ? (
                    filteredCandidates.length === 0 ? (
                      <div className="rounded-xl border border-dashed border-border p-6 text-center">
                        <p className="font-medium">No candidates in inbox</p>
                        <p className="mt-1 text-sm text-muted-foreground">Sync Drive or add manually</p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        {filteredCandidates.map((candidate) => {
                          const score = candidate.match_score || candidate.ats_score || 0
                          return (
                            <button
                              key={candidate.id}
                              type="button"
                              onClick={() => setSelectedCandidateId(candidate.id)}
                              className="flex w-full items-center gap-3 rounded-xl border border-border bg-surface-2 p-3 text-left transition hover:border-primary/30 hover:bg-surface-3"
                            >
                              <Avatar className="h-10 w-10">
                                <AvatarFallback className="bg-[hsl(var(--brand))] text-white">
                                  {initials(candidate.name || candidate.email || 'C')}
                                </AvatarFallback>
                              </Avatar>

                              <div className="min-w-0 flex-1">
                                <div className="flex items-center gap-2">
                                  <p className="truncate text-sm font-semibold">{candidate.name}</p>
                                  <Badge variant="outline" className={cn('text-[10px]', scoreTone(score))}>
                                    {scoreLabel(score)}
                                  </Badge>
                                </div>
                                <p className="truncate text-xs text-muted-foreground">{candidate.role}</p>
                                <p className="mt-1 text-[11px] text-muted-foreground">
                                  {formatRelativeTime(candidate.created_at)}
                                </p>
                              </div>

                              <Badge variant="secondary" className="shrink-0">
                                {score}
                              </Badge>
                            </button>
                          )
                        })}
                      </div>
                    )
                  ) : (
                    <div className="space-y-4">
                      <Button variant="ghost" size="sm" onClick={() => setSelectedCandidateId(null)} className="px-0">
                        <ArrowLeft className="mr-2 h-4 w-4" />
                        Back to inbox
                      </Button>

                      <div className="rounded-2xl border border-border bg-surface-2 p-4">
                        <div className="flex items-start gap-3">
                          <Avatar className="h-12 w-12">
                            <AvatarFallback className="bg-[hsl(var(--brand))] text-white">
                              {initials(selectedCandidate.name)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="min-w-0 flex-1">
                            <h4 className="font-semibold">{selectedCandidate.name}</h4>
                            <p className="text-sm text-muted-foreground">{selectedCandidate.role}</p>
                            <div className="mt-2 flex flex-wrap gap-2 text-xs">
                              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1">
                                <Mail className="h-3 w-3" />
                                {selectedCandidate.email || 'No email'}
                              </span>
                              <span className="inline-flex items-center gap-1 rounded-full bg-surface px-2 py-1">
                                <Clock3 className="h-3 w-3" />
                                {formatRelativeTime(selectedCandidate.created_at)}
                              </span>
                            </div>
                          </div>
                        </div>

                        <div className="mt-4 grid grid-cols-[96px_1fr] gap-4">
                          <div className="flex items-center justify-center">
                            <div className="relative flex h-24 w-24 items-center justify-center rounded-full" style={scoreRing(selectedCandidate.match_score || 0)}>
                              <div className="flex h-16 w-16 items-center justify-center rounded-full bg-surface text-lg font-semibold">
                                {selectedCandidate.match_score || 0}
                              </div>
                            </div>
                          </div>
                          <div className="space-y-2">
                            <p className="text-sm font-medium">{scoreLabel(selectedCandidate.match_score || 0)} Match</p>
                            <p className="text-xs text-muted-foreground">
                              {Array.isArray(selectedCandidate.match_breakdown)
                                ? `${selectedCandidate.match_breakdown.filter((item) => item.matched).length} of ${selectedCandidate.match_breakdown.length} criteria matched`
                                : 'No screening breakdown yet'}
                            </p>
                            <div className="space-y-1">
                              {(selectedCandidate.match_breakdown || []).slice(0, 4).map((item, index) => (
                                <div
                                  key={`${item.questionText}-${index}`}
                                  className={cn(
                                    'rounded-lg border px-3 py-2 text-xs',
                                    item.matched
                                      ? 'border-success/20 bg-success/10 text-success'
                                      : 'border-destructive/20 bg-destructive/10 text-destructive'
                                  )}
                                >
                                  <div className="flex items-center justify-between gap-2">
                                    <span className="truncate">{item.questionText}</span>
                                    <span className="font-semibold">{item.matched ? '✓' : '✗'}</span>
                                  </div>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-surface-2 p-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold">Resume</h5>
                          <Badge variant="secondary">Drive</Badge>
                        </div>
                        <div className="mt-3 flex gap-2">
                          {selectedCandidate.resume_url ? (
                            <Button asChild variant="outline" className="flex-1">
                              <a href={selectedCandidate.resume_url} target="_blank" rel="noreferrer">
                                View Resume
                              </a>
                            </Button>
                          ) : (
                            <div className="flex-1 rounded-lg border border-dashed border-border px-3 py-2 text-sm text-muted-foreground">
                              No resume link available
                            </div>
                          )}
                        </div>
                      </div>

                      <div className="rounded-2xl border border-border bg-surface-2 p-4">
                        <div className="flex items-center justify-between">
                          <h5 className="text-sm font-semibold">Notes</h5>
                          <Badge variant="secondary">{selectedCandidate.notes?.length || 0}</Badge>
                        </div>
                        <div className="mt-3 space-y-2">
                          {(selectedCandidate.notes || []).slice(-2).reverse().map((note, index) => (
                            <div key={`${note.createdAt}-${index}`} className="rounded-lg bg-surface p-3 text-xs">
                              <p className="font-medium">{note.authorName || note.author_name || 'Team'}</p>
                              <p className="text-muted-foreground">{note.text}</p>
                            </div>
                          ))}
                          <Textarea
                            value={noteText}
                            onChange={(event) => setNoteText(event.target.value)}
                            placeholder="Add a note..."
                            className="min-h-20 bg-surface"
                          />
                          <Button
                            onClick={() => addNoteMutation.mutate({ id: selectedCandidate.id, text: noteText })}
                            disabled={!noteText.trim() || addNoteMutation.isPending}
                            className="w-full"
                          >
                            <MessageSquare className="mr-2 h-4 w-4" />
                            Save Note
                          </Button>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Reason</label>
                          <Select value={rejectReason} onValueChange={setRejectReason}>
                            <SelectTrigger className="h-10 bg-surface-2">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              {['Not a fit', 'Overqualified', 'Location', 'Salary', 'Other'].map((reason) => (
                                <SelectItem key={reason} value={reason}>
                                  {reason}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-xs font-medium text-muted-foreground">Actions</label>
                          <div className="grid grid-cols-2 gap-2">
                            <Button
                              variant="outline"
                              className="border-destructive/30 text-destructive"
                              onClick={handleReject}
                              disabled={notInterestedMutation.isPending}
                            >
                              <BadgeAlert className="mr-2 h-4 w-4" />
                              Not Interested
                            </Button>
                            <Button onClick={handleInterview} disabled={moveToPipelineMutation.isPending}>
                              <Check className="mr-2 h-4 w-4" />
                              Interview
                            </Button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </ScrollArea>
            </motion.div>
          ) : null}
        </AnimatePresence>
      </div>
    </div>
  )
}

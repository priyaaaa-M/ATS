import { AnimatePresence, motion } from 'framer-motion'
import { ChevronLeft, ChevronRight, X } from 'lucide-react'
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query'
import type { Candidate } from '../../../types'
import { candidatesApi, interviewsApi } from '../../../api'
import { Avatar } from '../../shared/Avatar'
import { Button } from '../../ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '../../ui/tabs'
import { OverviewTab } from './OverviewTab'
import { LinkedInTab } from './LinkedInTab'
import { ResumeTab } from './ResumeTab'
import { ActivityTab } from './ActivityTab'
import { ScorecardsTab } from './ScorecardsTab'
import { InternalNotesTab } from './InternalNotesTab'
import { BookSlotTab } from './BookSlotTab'
import { FeedbackTab } from './FeedbackTab'
import { timeAgo } from '../../../lib/utils'
import { useAuth } from '../../../hooks/useAuth'

export function CandidateSlidePanel({
  candidateId,
  candidates,
  open,
  onClose,
  onNavigate,
}: {
  candidateId?: string | null
  candidates: Candidate[]
  open: boolean
  onClose: () => void
  onNavigate: (id: string) => void
}) {
  const qc = useQueryClient()
  const { user } = useAuth()
  const currentIndex = candidates.findIndex((item) => item.id === candidateId)
  const { data: candidate } = useQuery({
    queryKey: ['candidate', candidateId],
    queryFn: () => candidatesApi.getById(candidateId ?? ''),
    enabled: Boolean(candidateId),
  })
  const { data: interviews = [] } = useQuery({
    queryKey: ['candidate-interviews', candidateId],
    queryFn: () => interviewsApi.getByCandidateId(candidateId ?? ''),
    enabled: Boolean(candidateId),
  })
  const interview = interviews[0]

  const noteMutation = useMutation({
    mutationFn: (text: string) => candidatesApi.addNote(candidateId ?? '', text, true),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ['candidate', candidateId] })
      qc.invalidateQueries({ queryKey: ['candidates'] })
    },
  })

  const actionMutation = useMutation({
    mutationFn: ({ action, reason }: { action: 'maybe_later' | 'reject' | 'interview'; reason?: string }) => candidatesApi.action(candidateId ?? '', action, reason),
    onSuccess: () => qc.invalidateQueries({ queryKey: ['candidates'] }),
  })

  const tabs = user?.role === 'interviewer'
    ? ['overview', 'linkedin', 'resume', 'book-slot', 'feedback']
    : ['overview', 'linkedin', 'resume', 'activity', 'scorecards', 'internal-notes']

  return (
    <AnimatePresence>
      {open && candidate ? (
        <>
          <motion.div className="fixed inset-0 z-40 bg-black/25" onClick={onClose} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} />
          <motion.aside initial={{ x: 680 }} animate={{ x: 0 }} exit={{ x: 680 }} transition={{ duration: 0.2 }} className="fixed right-0 top-0 z-50 h-full w-[680px] overflow-y-auto bg-[var(--bg-page)] p-6 shadow-2xl">
            <div className="mb-4 flex items-center justify-between">
              <button onClick={onClose}><X className="h-5 w-5" /></button>
              <div className="flex items-center gap-3 text-sm">
                <button disabled={currentIndex <= 0} onClick={() => currentIndex > 0 && onNavigate(candidates[currentIndex - 1].id)}><ChevronLeft className="h-4 w-4" /></button>
                <span>{currentIndex + 1} of {candidates.length}</span>
                <button disabled={currentIndex === candidates.length - 1} onClick={() => currentIndex < candidates.length - 1 && onNavigate(candidates[currentIndex + 1].id)}><ChevronRight className="h-4 w-4" /></button>
              </div>
            </div>
            {candidate.inboxStatus === 'inbox' ? (
              <div className="mb-4 rounded-[12px] border px-4 py-3" style={{ background: '#FFF8F0', borderColor: 'var(--brand-mid)' }}>
                <p className="text-sm">Submitted {timeAgo(candidate.createdAt)}. Update status?</p>
              </div>
            ) : null}
            <div className="mb-5 flex items-center gap-4">
              <Avatar name={candidate.name} size="lg" className="h-[46px] w-[46px]" />
              <div>
                <p className="text-[15px] font-semibold">{candidate.name}</p>
                <p className="text-sm text-[var(--text-2)]">{candidate.parsedData?.headline ?? candidate.role}</p>
                <p className="text-sm text-[var(--text-3)]">{candidate.parsedData?.location ?? 'Location unavailable'}</p>
              </div>
            </div>
            {user?.role !== 'interviewer' ? (
              <div className="mb-5 flex flex-wrap gap-2">
                <Button variant="secondary" onClick={() => actionMutation.mutate({ action: 'maybe_later' })}>Maybe Later</Button>
                <Button variant="outline" onClick={() => actionMutation.mutate({ action: 'reject', reason: 'Rejected from frontend' })}>Reject</Button>
                <Button onClick={() => actionMutation.mutate({ action: 'interview' })}>Interview</Button>
                <Button variant="ghost">More</Button>
              </div>
            ) : null}
            <Tabs defaultValue={tabs[0]}>
              <TabsList className="mb-6 border-b">
                {tabs.map((tab) => <TabsTrigger key={tab} value={tab}>{tab.replace('-', ' ')}</TabsTrigger>)}
              </TabsList>
              <TabsContent value="overview"><OverviewTab candidate={candidate} interview={interview} /></TabsContent>
              <TabsContent value="linkedin"><LinkedInTab candidate={candidate} /></TabsContent>
              <TabsContent value="resume"><ResumeTab candidate={candidate} /></TabsContent>
              <TabsContent value="activity"><ActivityTab candidate={candidate} /></TabsContent>
              <TabsContent value="scorecards"><ScorecardsTab candidate={candidate} /></TabsContent>
              <TabsContent value="internal-notes"><InternalNotesTab candidate={candidate} onAddNote={(text) => noteMutation.mutate(text)} /></TabsContent>
              <TabsContent value="book-slot"><BookSlotTab candidate={candidate} /></TabsContent>
              <TabsContent value="feedback"><FeedbackTab /></TabsContent>
            </Tabs>
          </motion.aside>
        </>
      ) : null}
    </AnimatePresence>
  )
}

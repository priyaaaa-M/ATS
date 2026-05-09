import { useEffect, useMemo, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Link } from 'react-router-dom'
import {
  ArrowRight,
  BriefcaseBusiness,
  Building2,
  ChevronDown,
  CheckCircle2,
  Circle,
  Clock,
  FolderSync,
  Layers3,
  ListChecks,
  Lock,
  UploadCloud,
  UserPlus,
  X,
} from 'lucide-react'
import { companyApi, inviteApi, rolesApi, roundsApi, sourcesApi } from '../../api'
import type { Candidate } from '../../types'
import { Button } from '../ui/button'
import { Card, CardContent } from '../ui/card'

type OnboardingStep = {
  id: string
  title: string
  description: string
  insight: string
  time: string
  completed: boolean
  available: boolean
  lockedReason?: string
  href: string
  cta: string
  icon: typeof Building2
}

const snoozeStorageKey = 'ats-hr-onboarding-snoozed-until'
const oneDayMs = 24 * 60 * 60 * 1000

export function HrOnboardingChecklist({
  candidates,
}: {
  candidates: Candidate[]
}) {
  const [isSnoozed, setIsSnoozed] = useState(false)
  const [showDetails, setShowDetails] = useState(false)

  const { data: profile } = useQuery({
    queryKey: ['company-profile'],
    queryFn: () => companyApi.getProfile(),
    staleTime: 60_000,
  })

  const { data: roles = [] } = useQuery({
    queryKey: ['roles'],
    queryFn: () => rolesApi.list(),
    staleTime: 60_000,
  })

  const { data: rounds = [] } = useQuery({
    queryKey: ['rounds', 'all'],
    queryFn: () => roundsApi.listAll(),
    staleTime: 60_000,
  })

  const { data: invites = [] } = useQuery({
    queryKey: ['invites'],
    queryFn: () => inviteApi.list(),
    staleTime: 60_000,
  })

  const { data: driveConfig } = useQuery({
    queryKey: ['drive-config'],
    queryFn: () => companyApi.getDriveConfig(),
    staleTime: 60_000,
  })

  const { data: sources = [] } = useQuery({
    queryKey: ['sources'],
    queryFn: () => sourcesApi.list(),
    staleTime: 60_000,
  })

  const activeSourceCount = sources.filter((source) => source.active).length

  const steps = useMemo<OnboardingStep[]>(
    () => [
      {
        id: 'company',
        title: 'Set company profile',
        description: 'Add company name, brand colour, and basic context.',
        insight: 'This gives candidates, emails, and the hiring workspace the right company identity.',
        time: '30 sec',
        completed: Boolean(profile?.name),
        available: true,
        href: '/settings?tab=company',
        cta: 'Open profile',
        icon: Building2,
      },
      {
        id: 'sources',
        title: 'Add candidate sources',
        description: 'Standardize where candidates come from before importing resumes.',
        insight: activeSourceCount
          ? `${activeSourceCount} active source${activeSourceCount === 1 ? '' : 's'} ready for manual upload and Drive validation.`
          : 'Sources keep campus, referral, agency, and manual uploads measurable and clean.',
        time: '1 min',
        completed: activeSourceCount > 0,
        available: Boolean(profile?.name),
        lockedReason: 'Available after company profile is saved.',
        href: '/settings?tab=sources',
        cta: 'Add sources',
        icon: FolderSync,
      },
      {
        id: 'roles',
        title: 'Create hiring roles',
        description: 'Sync roles from your Drive structure so candidates have a home.',
        insight: roles.length
          ? `${roles.length} role${roles.length === 1 ? '' : 's'} found. Next, make sure each active role has interview rounds.`
          : 'Roles are the anchor for filters, pipelines, interview rounds, and analytics.',
        time: '1 min',
        completed: roles.length > 0,
        available: Boolean(profile?.name),
        lockedReason: 'Available after company profile is saved.',
        href: '/settings?tab=rounds',
        cta: 'Set roles',
        icon: BriefcaseBusiness,
      },
      {
        id: 'rounds',
        title: 'Configure interview rounds',
        description: 'Assign interviewers and durations for each active role.',
        insight: rounds.length
          ? `${rounds.length} round${rounds.length === 1 ? '' : 's'} configured. Interviewers can be invited next.`
          : 'Rounds tell the ATS who receives each approved candidate and what happens next.',
        time: '2 min',
        completed: rounds.length > 0,
        available: roles.length > 0,
        lockedReason: 'Available after at least one hiring role exists.',
        href: '/settings?tab=rounds',
        cta: 'Add rounds',
        icon: Layers3,
      },
      {
        id: 'invite',
        title: 'Invite interviewers',
        description: 'Send Google login invites so interviewers can book slots.',
        insight: rounds.length
          ? `${rounds.length} configured round${rounds.length === 1 ? '' : 's'} need interviewer access before booking works.`
          : 'Invite links are enabled once interview rounds have assigned interviewers.',
        time: '1 min',
        completed: invites.length > 0,
        available: rounds.length > 0,
        lockedReason: 'Available after interview rounds are configured.',
        href: '/settings?tab=invite',
        cta: 'Send invite',
        icon: UserPlus,
      },
      {
        id: 'source',
        title: 'Connect resume source',
        description: 'Connect Google Drive or use manual upload for structured intake.',
        insight: driveConfig?.driveFolderLink
          ? 'Drive is connected. You can sync folders or continue with manual uploads.'
          : 'A connected source keeps resumes, roles, and future syncs organized.',
        time: '2 min',
        completed: Boolean(driveConfig?.driveFolderLink) || candidates.length > 0,
        available: roles.length > 0 && activeSourceCount > 0,
        lockedReason: 'Available after roles and candidate sources are created.',
        href: '/settings?tab=integrations',
        cta: 'Connect Drive',
        icon: FolderSync,
      },
      {
        id: 'import',
        title: 'Import first resumes',
        description: 'Bring candidates into the inbox only after setup is ready.',
        insight: 'Once candidates are imported, HR review, approvals, scheduling, and feedback can start.',
        time: '2 min',
        completed: candidates.length > 0,
        available: roles.length > 0 && activeSourceCount > 0,
        lockedReason: 'Available after roles and candidate sources are created.',
        href: '/candidates',
        cta: 'Import resumes',
        icon: UploadCloud,
      },
    ],
    [activeSourceCount, candidates.length, driveConfig?.driveFolderLink, invites.length, profile?.name, roles.length, rounds.length]
  )

  useEffect(() => {
    const snoozedUntil = Number(window.localStorage.getItem(snoozeStorageKey) || 0)
    setIsSnoozed(snoozedUntil > Date.now())
  }, [])

  const completedCount = steps.filter((step) => step.completed).length
  const progress = Math.round((completedCount / steps.length) * 100)
  const nextStep =
    steps.find((step) => !step.completed && step.available) ??
    steps.find((step) => !step.completed)
  const completedSteps = steps.filter((step) => step.completed)
  const pendingSteps = steps.filter((step) => !step.completed)
  const isAlmostReady = pendingSteps.length === 1
  const lockedSteps = pendingSteps.filter((step) => !step.available)

  const snooze = () => {
    window.localStorage.setItem(snoozeStorageKey, String(Date.now() + oneDayMs))
    setIsSnoozed(true)
  }

  if (completedCount === steps.length || isSnoozed || !nextStep) {
    return null
  }

  const NextIcon = nextStep.icon

  return (
    <Card className="overflow-hidden border-[var(--brand)]/20 bg-[var(--bg-card)]">
      <CardContent className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 xl:flex-row xl:items-center xl:justify-between">
          <div className="flex min-w-0 gap-4">
            <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--brand)]/25 bg-[var(--brand)]/10 text-[var(--brand)]">
              <ListChecks className="h-5 w-5" />
            </div>
            <div className="min-w-0">
              <p className="text-xs font-bold uppercase tracking-[0.16em] text-[var(--brand)]">
                Workspace Setup
              </p>
              <h2 className="mt-1 text-xl font-bold tracking-tight text-[var(--text-1)]">
                {isAlmostReady ? 'One setup step left' : 'Finish setup before importing'}
              </h2>
              <p className="mt-2 max-w-2xl text-sm leading-relaxed text-[var(--text-2)]">
                Next: <span className="font-semibold text-[var(--text-1)]">{nextStep.title}</span>
                {' - '}
                {nextStep.description}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <div className="min-w-52 rounded-xl border border-[var(--border)] bg-[var(--muted)]/20 px-4 py-3">
              <div className="mb-2 flex items-center justify-between text-xs font-medium text-[var(--text-2)]">
                <span>{completedCount}/{steps.length} complete</span>
                <span>{progress}%</span>
              </div>
              <div className="h-2 overflow-hidden rounded-full bg-[var(--muted)]">
                <div
                  className="h-full rounded-full bg-[var(--brand)] transition-all"
                  style={{ width: `${progress}%` }}
                />
              </div>
            </div>
            <Button asChild>
              <Link to={nextStep.href}>
                Continue
                <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={snooze}
              title="Remind me later"
              aria-label="Remind me later"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <button
          type="button"
          onClick={() => setShowDetails((value) => !value)}
          className="mt-4 flex items-center gap-2 text-xs font-medium text-[var(--text-2)] transition-colors hover:text-[var(--text-1)]"
        >
          <ChevronDown
            className={`h-4 w-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
          />
          {showDetails ? 'Hide setup details' : 'Show setup details'}
        </button>

        {showDetails && (
          <div className="mt-5 grid gap-4 xl:grid-cols-[minmax(0,1fr)_320px]">
            <Link
              to={nextStep.href}
              className="group rounded-xl border border-[var(--brand)]/30 bg-[var(--brand)]/10 p-4 transition-colors hover:border-[var(--brand)]/60"
            >
              <div className="flex gap-4">
                <div className="flex h-11 w-11 flex-shrink-0 items-center justify-center rounded-xl border border-[var(--brand)]/25 bg-[var(--bg-card)] text-[var(--brand)]">
                  <NextIcon className="h-5 w-5" />
                </div>
                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-[var(--brand)]/30 bg-[var(--bg-card)] px-2 py-1 text-[10px] font-semibold uppercase tracking-wide text-[var(--brand)]">
                      Next step
                    </span>
                    <span className="inline-flex items-center gap-1 text-xs text-[var(--text-2)]">
                      <Clock className="h-3.5 w-3.5" />
                      {nextStep.time}
                    </span>
                  </div>
                  <h3 className="mt-2 text-lg font-bold text-[var(--text-1)]">{nextStep.title}</h3>
                  <p className="mt-1 text-sm leading-relaxed text-[var(--text-2)]">{nextStep.insight}</p>
                  <p className="mt-3 inline-flex items-center gap-1 text-sm font-semibold text-[var(--brand)]">
                    {nextStep.cta}
                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                  </p>
                </div>
              </div>
            </Link>

            <div className="rounded-xl border border-[var(--border)] bg-[var(--muted)]/15 p-4">
              <p className="text-xs font-semibold uppercase tracking-wide text-[var(--text-2)]">
                Setup Status
              </p>
              <div className="mt-3 grid gap-2">
                {steps.map((step) => (
                  <div key={step.id} className="flex items-center gap-2 text-xs text-[var(--text-2)]">
                    {step.completed ? (
                      <CheckCircle2 className="h-3.5 w-3.5 flex-shrink-0 text-emerald-400" />
                    ) : step.available ? (
                      <Circle className="h-3.5 w-3.5 flex-shrink-0" />
                    ) : (
                      <Lock className="h-3.5 w-3.5 flex-shrink-0" />
                    )}
                    <span className={step.id === nextStep.id ? 'font-medium text-[var(--text-1)]' : ''}>
                      {step.title}
                    </span>
                  </div>
                ))}
              </div>
              {lockedSteps.length > 0 && (
                <p className="mt-3 text-xs leading-relaxed text-[var(--text-2)]">
                  Locked steps open automatically as earlier setup is completed.
                </p>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

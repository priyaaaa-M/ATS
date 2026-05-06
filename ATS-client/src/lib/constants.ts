import {
  Briefcase,
  CalendarClock,
  ClipboardCheck,
  FileSearch,
  Handshake,
  MessageSquareText,
  PhoneCall,
  Users,
} from 'lucide-react'
import type { LucideIcon } from 'lucide-react'
import type { CandidateStatus } from '../types'

export const STATUS_COLORS: Record<CandidateStatus | 'draft' | 'open' | 'paused' | 'completed', { bg: string; text: string; border: string }> = {
  pending: { bg: 'var(--warning-light)', text: 'var(--warning)', border: 'var(--warning)' },
  hr_approved: { bg: 'var(--info-light)', text: 'var(--info)', border: 'var(--info)' },
  scheduled: { bg: 'var(--brand-light)', text: 'var(--brand)', border: 'var(--brand)' },
  completed: { bg: 'var(--teal-light)', text: 'var(--teal)', border: 'var(--teal)' },
  selected: { bg: 'var(--success-light)', text: 'var(--success)', border: 'var(--success)' },
  rejected: { bg: 'var(--error-light)', text: 'var(--error)', border: 'var(--error)' },
  draft: { bg: 'var(--warning-light)', text: 'var(--warning)', border: 'var(--warning)' },
  open: { bg: 'var(--success-light)', text: 'var(--success)', border: 'var(--success)' },
  paused: { bg: 'var(--bg-hover)', text: 'var(--text-2)', border: 'var(--border)' },
}

export const SCORE_COLORS = {
  high: 'var(--success)',
  medium: 'var(--warning)',
  low: 'var(--error)',
}

export const STAGE_ICONS: Record<string, LucideIcon> = {
  sourcing: FileSearch,
  screening: PhoneCall,
  'hiring manager': Users,
  technical: ClipboardCheck,
  culture: MessageSquareText,
  final: Handshake,
  offer: Briefcase,
  hired: CalendarClock,
}

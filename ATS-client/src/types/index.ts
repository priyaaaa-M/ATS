export type UserRole = 'executive' | 'hiring_manager' | 'recruiter' | 'interviewer' | 'team_member' | 'hr'
export type CandidateStatus = 'pending' | 'hr_approved' | 'scheduled' | 'completed' | 'selected' | 'rejected'
export type InboxStatus = 'inbox' | 'pipeline' | 'rejected'

export interface Company {
  id: string
  name: string
  description?: string | null
  industry?: string | null
  size?: string | null
  website?: string | null
  logoUrl?: string | null
  brandColor?: string | null
  driveFolderLink?: string | null
  slackWebhookUrl?: string | null
  slackChannel?: string | null
  slackNotifyEvents?: string[] | null
  lastSyncAt?: string | null
}

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  companyId?: string | null
  company?: Company | null
}

export interface ScreeningAnswer {
  question: string
  answer: string
  value?: 'yes' | 'no' | 'maybe'
}

export interface CandidateNote {
  id: string
  text: string
  createdAt: string
  authorName?: string
  createdByName?: string
  createdById?: string
  isPrivate?: boolean
}

export interface CandidateActivity {
  id: string
  type: 'status_change' | 'note_added' | 'interview_scheduled' | 'feedback_submitted' | 'system'
  text?: string
  message?: string
  createdAt?: string
  timestamp: string
  actorName?: string
  actorInitials?: string
  color?: string
}

export interface MatchBreakdownItem {
  label: string
  score: number
}

export interface ParsedExperience {
  company?: string
  title?: string
  duration?: string
  description?: string
  current?: boolean
  technologies?: string[]
  location?: string
}

export interface ParsedEducation {
  institution?: string
  degree?: string
  year?: string
  grade?: string
  location?: string
}

export interface ParsedData {
  summary?: string
  experience?: ParsedExperience[]
  education?: ParsedEducation[]
  skills?: Array<{ name: string; category?: string }>
  screeningAnswers?: Array<{ question?: string; answer?: string }>
  socials?: {
    linkedin?: string
    github?: string
    portfolio?: string
  }
  location?: string
  headline?: string
  confirmedInterest?: boolean
  visaRequired?: boolean
  relocationReady?: boolean
  salaryExpectation?: string
  salary?: string
}

export interface Candidate {
  id: string
  name: string
  candidateEmail: string
  phone?: string | null
  role: string
  status: CandidateStatus
  currentRound?: number | null
  totalRounds?: number | null
  assignedInterviewerEmail?: string | null
  roundStatus?: string | null
  meetLink?: string | null
  atsScore?: number | null
  inboxStatus: InboxStatus
  currentStage?: string | null
  currentStageId?: string | null
  linkedinUrl?: string | null
  parsedData?: ParsedData | null
  notes?: CandidateNote[]
  stageHistory?: CandidateActivity[]
  screeningAnswers?: ScreeningAnswer[]
  matchScore?: number | null
  matchBreakdown?: MatchBreakdownItem[]
  resumeUrl?: string | null
  driveFileId?: string | null
  createdAt: string
}

export interface InterviewStage {
  id: string
  name: string
  order: number
  duration: number
  interviewerName?: string | null
  interviewerGmail?: string | null
  description?: string | null
  scorecardTemplate?: string[] | null
  updatedAt?: string | null
}

export interface InterviewRound {
  id: string
  roleName: string
  roundNumber: number
  interviewerName: string
  interviewerGmail: string
  duration?: string | null
  createdAt?: string
  updatedAt?: string | null
}

export interface Role {
  id: string
  name: string
  title: string
  status: 'draft' | 'open' | 'paused' | 'closed'
  description?: string | null
  hiringGoals?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  workTags?: string[] | null
  screeningQuestions?: Array<{ id?: string; question: string }>
  interviewStages?: InterviewStage[]
  hiringManagerId?: string | null
  hiringManagerName?: string | null
  candidateCount?: number
  averageAtsScore?: number
  roundCount?: number
  pipelineCounts?: {
    submitted: number
    inProcess: number
    hired: number
    rejected: number
  }
}

export interface Interview {
  id: string
  candidateId: string
  candidateName: string
  role: string
  roleName?: string
  roundNumber?: number
  stageName?: string
  interviewerEmail?: string
  interviewerName?: string
  scheduledAt?: string | null
  endAt?: string | null
  scheduledStartTime?: string | null
  scheduledEndTime?: string | null
  bookedAt?: string | null
  durationMinutes?: number | null
  feedbackSubmitted?: boolean
  status: 'pending' | 'scheduled' | 'completed' | 'pending_slot' | 'cancelled' | 'rescheduled'
  meetLink?: string | null
  hasFeedback?: boolean
}

export interface Scorecard {
  id?: string
  criteria?: Array<{ questionId: string; value: 'yes' | 'no' | 'unknown' }>
  overallFit?: string
}

export interface NotificationActivity {
  id: string
  type: string
  message: string
  isRead?: boolean
  metadata?: {
    candidateId?: string
    actorName?: string
    actorInitials?: string
  } | null
  createdAt: string
}

export interface Invite {
  id: string
  email: string
  roleName: string
  roundNumber: number
  used: boolean
  expiresAt: string
  createdAt: string
  token?: string
}

export interface Feedback {
  id?: string
  candidateId: string
  roundNumber: number
  communication: number
  technicalDepth: number
  problemSolving: number
  cultureFit: number
  recommendation: 'strong_no' | 'no' | 'maybe' | 'yes' | 'strong_yes'
  strengths: string
  improvements: string
  notes: string
  submittedAt?: string
}

export interface FreeSlot {
  start: string
  end: string
}

export interface BusyBlock {
  start: string
  end: string
  title: string
}

export interface FreeSlotsResponse {
  busy: BusyBlock[]
  free: FreeSlot[]
  timezone?: string
}

export interface SyncStatus {
  isSyncRunning: boolean
  lastSyncStartedAt?: string | null
  lastSyncCompletedAt?: string | null
  lastSyncError?: string | null
  totalProcessed?: number | null
  totalFailed?: number | null
  updatedAt?: string
}

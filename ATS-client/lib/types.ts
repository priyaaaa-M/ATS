// ATS Type Definitions

export interface Company {
  id: string
  name: string
  logo_url: string | null
  brand_color: string
  industry: string
  size: string
  description?: string
  website?: string
  slack_webhook_url?: string | null
  slack_channel_name?: string | null
  slack_events?: string[] | null
}

export interface DriveConfig {
  id: string
  drive_folder_link: string
  drive_folder_id: string | null
  last_sync_at: string | null
}

export interface SyncStatus {
  is_sync_running: boolean
  last_sync_started_at?: string | null
  last_sync_completed_at?: string | null
  last_sync_error?: string | null
  total_processed: number
  total_failed: number
}

export interface User {
  id: string
  email: string
  name: string
  role: 'executive' | 'hiring_manager' | 'recruiter' | 'interviewer' | 'team_member' | 'hr'
  avatar_url?: string | null
  company_id: string
}

export interface Candidate {
  id: string
  name: string
  email: string
  phone: string
  role: string
  status: 'pending' | 'hr_approved' | 'scheduled' | 'selected' | 'rejected'
  inbox_status?: 'inbox' | 'pipeline' | 'rejected'
  current_stage?: string | null
  stage_history?: CandidateStageHistory[]
  notes?: CandidateNote[]
  screening_answers?: ScreeningAnswer[]
  match_score?: number
  match_breakdown?: MatchBreakdownItem[]
  current_round: number
  total_rounds: number
  assigned_interviewer_email: string | null
  round_status?: string
  ats_score: number
  created_at: string
  parsed_data: CandidateParsedData
  resume_url?: string | null
  latest_interview?: Interview | null
  feedback?: Feedback | Feedback[] | null
  transcript?: Transcript | null
}

export interface CandidateStageHistory {
  stage: string
  timestamp: string
  moved_by?: string | null
}

export interface CandidateNote {
  text: string
  authorId?: string | null
  author_name?: string
  authorName?: string
  createdAt?: string
}

export interface ScreeningAnswer {
  question_id?: string
  question_text: string
  answer?: string
  matched?: boolean
  score?: number
}

export interface MatchBreakdownItem {
  questionId?: string
  questionText: string
  answer?: string
  idealAnswer?: string
  matched: boolean
  score: number
}

export interface CandidateParsedData {
  education: Education[]
  experience: Experience[]
  projects: Project[]
  skills: Skill[]
}

export interface Education {
  institution: string
  degree: string
  year: string
  grade: string
}

export interface Experience {
  company: string
  title: string
  duration: string
  description: string
  current: boolean
}

export interface Project {
  name: string
  description: string
  tech: string[]
}

export interface Skill {
  name: string
  level: 'expert' | 'intermediate' | 'beginner'
}

export interface Interview {
  id: string
  candidate_id: string
  candidate_name: string
  candidate_email?: string | null
  candidate_role?: string | null
  interviewer_email: string
  interviewer_name: string
  scheduled_at: string
  scheduled_end_at?: string
  meet_link: string
  round: number
  status: 'scheduled' | 'completed' | 'cancelled' | 'rescheduled'
  duration_minutes?: number
}

export interface Interviewer {
  id: string
  name: string
  email: string
  avatar_url: string | null
}

export interface Feedback {
  id: string
  candidate_id: string
  interviewer_email?: string
  round_number: number
  technical_rating?: number
  communication_rating?: number
  problem_solving_rating?: number
  overall_rating?: number
  strengths: string
  weaknesses: string
  recommendation: string
  notes: string
}

export interface CandidateFilters {
  role?: string
  status?: string
  min_ats_score?: number
  round?: number
  search?: string
  inboxStatus?: 'inbox' | 'pipeline' | 'rejected'
}

export interface Role {
  id: string
  name: string
}

export interface RoleDetails {
  id: string
  companyId?: string | null
  userId?: string | null
  name: string
  title?: string | null
  description?: string | null
  hiringGoals?: string | null
  salaryMin?: number | null
  salaryMax?: number | null
  salaryCurrency?: string | null
  expectations?: string | null
  activities?: string | null
  workTags?: string[] | null
  sellingPoints?: string | null
  screeningGuide?: string | null
  outreachTemplate?: string | null
  screeningQuestions?: ScreeningQuestion[]
  interviewStages?: InterviewStage[]
  status?: 'draft' | 'open' | 'paused' | 'closed' | string | null
  hiringManagerId?: string | null
  assignedRecruiterIds?: string[] | null
  createdAt?: string
  updatedAt?: string
  candidateCount?: number
  hiringManagerName?: string | null
}

export interface ScreeningQuestion {
  id?: string
  question: string
  type: 'text' | 'number' | 'select' | 'boolean'
  options?: string[]
  required?: boolean
  ideal_answer?: string
  weight?: number
}

export interface InterviewStage {
  name: string
  order: number
  assigned_to?: string[]
  instructions?: string
  auto_advance?: boolean
}

export interface InterviewRound {
  id: string
  role_name: string
  round_number: number
  interviewer_name: string
  interviewer_gmail: string
}

export interface Invite {
  id: string
  email: string
  token: string
  role_name: string
  round_number: number
  used: boolean
  expires_at: string
  invite_link?: string
}

export interface Transcript {
  id: string
  candidate_id: string
  round_number: number
  interviewer_email: string
  transcript_text?: string | null
  summary?: string | null
  report_url?: string | null
  video_url?: string | null
  source: string
  received_at: string
}

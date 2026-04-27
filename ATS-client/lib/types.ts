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
  role: 'hr' | 'interviewer'
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
}

export interface Role {
  id: string
  name: string
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

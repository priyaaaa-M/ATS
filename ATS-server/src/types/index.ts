export type UserRole =
  | 'executive'
  | 'hiring_manager'
  | 'recruiter'
  | 'interviewer'
  | 'team_member'
  | 'hr'

export interface ParsedEducation {
  institution?: string
  degree?: string
  year?: string
  grade?: string
}

export interface ParsedExperience {
  company?: string
  title?: string
  duration?: string
  description?: string
  current?: boolean
  technologies?: string[]
}

export interface ParsedProject {
  name?: string
  description?: string
  tech?: string[]
}

export interface ParsedSkill {
  name: string
  level?: string
  category?: string
}

export interface ParsedResumeSections {
  education: ParsedEducation[]
  experience: ParsedExperience[]
  projects: ParsedProject[]
  skills: ParsedSkill[]
}

export interface ParsedResumeResult {
  name?: string
  email?: string
  phone?: string
  atsScore: number
  sections: ParsedResumeSections
}

export interface CandidateFilters {
  role?: string
  status?: string
  search?: string
  minAtsScore?: number
  round?: number
  inboxStatus?: 'inbox' | 'pipeline' | 'rejected'
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

export interface RoleDetailsRecord {
  id: string
  companyId: string | null
  userId: string | null
  name: string
  title: string | null
  description: string | null
  hiringGoals: string | null
  salaryMin: number | null
  salaryMax: number | null
  salaryCurrency: string | null
  expectations: string | null
  activities: string | null
  workTags: string[] | null
  sellingPoints: string | null
  screeningGuide: string | null
  outreachTemplate: string | null
  screeningQuestions: ScreeningQuestion[] | null
  interviewStages: InterviewStage[] | null
  status: 'draft' | 'open' | 'paused' | 'closed' | string | null
  hiringManagerId: string | null
  assignedRecruiterIds?: string[] | null
  createdAt: Date
  updatedAt: Date | null
}

export class AppError extends Error {
  statusCode: number

  constructor(message: string, statusCode = 400) {
    super(message)
    this.name = 'AppError'
    this.statusCode = statusCode
  }
}
